import { useEffect, useRef, useState } from 'react'

const KEY = import.meta.env.VITE_NAVER_MAP_CLIENT_ID
let loader

// 네이버 지도 스크립트를 한 번만 불러옵니다. 인증 실패는 전역 콜백으로 알려 줍니다.
function loadNaver() {
  if (window.naver && window.naver.maps) return Promise.resolve()
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      window.navermap_authFailure = () => window.dispatchEvent(new Event('naver-auth-fail'))
      const s = document.createElement('script')
      s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(KEY)}`
      s.onload = resolve
      s.onerror = () => { loader = null; reject(new Error('load')) }
      document.head.appendChild(s)
    })
  }
  return loader
}

export default function NaverMap({ spot }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [error, setError] = useState('')
  const link = `https://map.naver.com/p/search/${encodeURIComponent('서귀포 ' + spot.name)}`

  useEffect(() => {
    const onFail = () => setError('네이버 지도 인증에 실패했어요. Client ID와 Web 서비스 URL 등록을 확인하세요.')
    window.addEventListener('naver-auth-fail', onFail)
    return () => { window.removeEventListener('naver-auth-fail', onFail); mapRef.current = null; markerRef.current = null }
  }, [])

  useEffect(() => {
    if (!KEY) return undefined
    let alive = true
    loadNaver()
      .then(() => {
        if (!alive || !boxRef.current) return
        const pos = new window.naver.maps.LatLng(spot.lat, spot.lng)
        if (!mapRef.current) {
          mapRef.current = new window.naver.maps.Map(boxRef.current, { center: pos, zoom: 15 })
          markerRef.current = new window.naver.maps.Marker({ position: pos, map: mapRef.current })
        } else {
          mapRef.current.setCenter(pos)
          markerRef.current.setPosition(pos)
        }
      })
      .catch(() => alive && setError('네이버 지도 스크립트를 불러오지 못했어요.'))
    return () => { alive = false }
  }, [spot])

  return (
    <div className="mapwrap">
      {KEY && !error ? (
        <div ref={boxRef} className="map" />
      ) : (
        // 네이버 Client ID가 없거나 인증에 실패하면 키가 필요 없는 구글 지도 임베드로 대신 보여 줍니다.
        <iframe
          className="map"
          title={`${spot.name} 위치`}
          src={`https://maps.google.com/maps?q=${spot.lat},${spot.lng}(${encodeURIComponent(spot.name)})&z=15&hl=ko&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          style={{ border: 0 }}
        />
      )}
      {error && <p className="muted small">{error} (대신 구글 지도를 보여 드려요)</p>}
      <a className="maplink" href={link} target="_blank" rel="noreferrer">네이버 지도에서 열기 ↗</a>
    </div>
  )
}

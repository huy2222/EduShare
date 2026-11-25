import { useSearchParams } from 'react-router-dom'

export default function useBrowseParams() {
  const [params, setParams] = useSearchParams()
  const pageValue = Number(params.get('page') || 0)
  const page = Number.isSafeInteger(pageValue) && pageValue >= 0 && pageValue <= 1000000 ? pageValue : 0
  function update(changes) {
    const next = new URLSearchParams(params)
    Object.entries({ page: '', ...changes }).forEach(([key, value]) => {
      if (value === '' || value == null || (key === 'page' && value === 0)) next.delete(key)
      else next.set(key, value)
    })
    setParams(next)
  }
  return { params, page, update }
}

import { useEffect, useState } from 'react'

export default function useLibraryData(key, load) {
  const [state, setState] = useState(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setState(null)
    Promise.resolve().then(load)
      .then(({ result }) => { if (active) setState({ key, data: result }) })
      .catch((error) => { if (active) setState({ key, error: error.message || 'Không thể tải dữ liệu. Vui lòng thử lại.' }) })
    return () => { active = false }
    // Every input to load is included in key; its function identity changes on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry])
  return { data: state?.key === key ? state.data : null, error: state?.key === key ? state.error : '', reload: () => setRetry((value) => value + 1) }
}

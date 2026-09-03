//hooks/useareavisuals.js
export function useAreaVisuals(fetcher) {
  const [visuals, setVisuals] = useState({});

  useEffect(() => {
    fetcher().then(setVisuals);
  }, [fetcher]);

  return visuals;
}

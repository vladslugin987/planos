import { useStore } from './store'

export function useGithubHeaders() {
  const { githubClientId, githubClientSecret } = useStore()
  
  return {
    'x-github-client-id': githubClientId || '',
    'x-github-client-secret': githubClientSecret || '',
  }
}


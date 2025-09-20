export interface RequestIdentity {
  ip: string | null
  userAgent: string | null
  acceptLanguage: string | null
  referer: string | null
}

export function extractRequestIdentity(request: Request & { headers: Headers; ip?: string | null }): RequestIdentity {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  const ipCandidate = forwarded ? forwarded.split(',')[0]?.trim() : null
  const ip = ipCandidate || (typeof (request as any).ip === 'string' ? ((request as any).ip as string) : null)

  const userAgent = request.headers.get('user-agent')
  const acceptLanguage = request.headers.get('accept-language')
  const referer = request.headers.get('referer') || request.headers.get('referrer')

  return {
    ip: ip && ip.length > 0 ? ip : null,
    userAgent: userAgent && userAgent.length > 0 ? userAgent : null,
    acceptLanguage: acceptLanguage && acceptLanguage.length > 0 ? acceptLanguage : null,
    referer: referer && referer.length > 0 ? referer : null,
  }
}

import { request, setSession, type Session } from './client';
import type { LoginResponse } from './types';

export async function login(email: string, password: string): Promise<Session> {
  const body = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    anonymous: true,
  });

  const session: Session = {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    email: body.user?.email ?? email,
  };

  setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    // A failed server-side logout must not strand the user in a signed-in UI.
  } finally {
    setSession(null);
  }
}

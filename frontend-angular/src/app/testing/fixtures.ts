import { AccountDto, PasswordDto } from '../core/api/models';

export const ACCOUNT: AccountDto = {
  id: 1,
  username: 'mario.rossi',
  email: 'mario.rossi@example.com',
  creazioneAccount: '2026-10-12',
};

export function makePassword(id: number, nomePassword: string, extra: Partial<PasswordDto> = {}): PasswordDto {
  return {
    id,
    nomePassword,
    password: `secret-${id}`,
    link: `https://${nomePassword.toLowerCase().replace(/\s+/g, '')}.example`,
    username: 'mario.rossi',
    note: null,
    creazionePassword: '2026-10-12',
    idAccount: ACCOUNT,
    ...extra,
  };
}

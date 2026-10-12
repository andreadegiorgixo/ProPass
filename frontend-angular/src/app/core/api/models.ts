// Stessi nomi dei DTO del backend (com.pro.pass.dto). Le date arrivano come "yyyy-MM-dd".

export interface AccountDto {
  id: number;
  username: string;
  email: string;
  creazioneAccount: string;
}

/** Registrazione e modifica dell'account. In modifica si inviano solo i campi cambiati. */
export interface AccountInput {
  username: string;
  email: string;
  password: string;
}

export type AccountUpdate = Partial<AccountInput>;

export interface LoginInput {
  email: string;
  password: string;
}

export interface PasswordDto {
  id: number;
  nomePassword: string;
  password: string;
  link: string;
  username: string;
  note: string | null;
  creazionePassword: string;
  idAccount: AccountDto;
}

/** id, creazionePassword e idAccount li decide il server: non si inviano. */
export interface PasswordInput {
  nomePassword: string;
  password: string;
  link: string;
  username: string;
  note: string | null;
}

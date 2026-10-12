package com.pro.pass.dto;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// DTO di RICHIESTA (registrazione e modifica): contiene solo i campi che il client può decidere.
// id e creazioneAccount li gestisce il server.
@Getter
@Setter
@NoArgsConstructor
@Data
public class AccountRequestDTO {
    private String username;
    private String email;
    private String password;
}

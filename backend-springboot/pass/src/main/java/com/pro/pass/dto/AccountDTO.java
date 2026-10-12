package com.pro.pass.dto;

import java.time.LocalDate;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// DTO di RISPOSTA: non contiene mai la password, nemmeno hashata.
@Getter
@Setter
@NoArgsConstructor
@Data
public class AccountDTO {
    private Long id;
    private String username;
    private String email;
    private LocalDate creazioneAccount;
}

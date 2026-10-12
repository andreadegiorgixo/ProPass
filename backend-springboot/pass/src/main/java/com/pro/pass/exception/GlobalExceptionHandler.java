package com.pro.pass.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.pro.pass.exception.AccountException.AccountNonEsistenteException;
import com.pro.pass.exception.AccountException.CredenzialiNonValideException;
import com.pro.pass.exception.AccountException.EmailGiaEsistenteException;
import com.pro.pass.exception.AccountException.RichiestaErrataCampiNonInseritiException;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteIdException;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteLinkException;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteNomePassword;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteUsernameException;

// Traduce le eccezioni del service nel codice HTTP giusto, invece di un 500 generico.
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccountNonEsistenteException.class)
    public ProblemDetail accountNonEsistente(AccountNonEsistenteException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(EmailGiaEsistenteException.class)
    public ProblemDetail emailGiaEsistente(EmailGiaEsistenteException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(RichiestaErrataCampiNonInseritiException.class)
    public ProblemDetail richiestaErrata(RichiestaErrataCampiNonInseritiException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(CredenzialiNonValideException.class)
    public ProblemDetail credenzialiNonValide(CredenzialiNonValideException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, e.getMessage());
    }
    
    @ExceptionHandler({
        PasswordNonTrovataTramiteIdException.class,
        PasswordNonTrovataTramiteLinkException.class,
        PasswordNonTrovataTramiteUsernameException.class,
        PasswordNonTrovataTramiteNomePassword.class
    })
    public ProblemDetail passwordNonTrovata(RuntimeException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail vincoloViolato(DataIntegrityViolationException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "Operazione non valida: un dato univoco (es. l'email) è già in uso");
    }
}

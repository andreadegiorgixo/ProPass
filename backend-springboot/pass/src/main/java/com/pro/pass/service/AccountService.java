package com.pro.pass.service;

import java.time.LocalDate;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pro.pass.dto.AccountDTO;
import com.pro.pass.dto.AccountRequestDTO;
import com.pro.pass.entity.Account;
import com.pro.pass.exception.AccountException.AccountNonEsistenteException;
import com.pro.pass.exception.AccountException.CredenzialiNonValideException;
import com.pro.pass.exception.AccountException.EmailGiaEsistenteException;
import com.pro.pass.exception.AccountException.RichiestaErrataCampiNonInseritiException;
import com.pro.pass.mapper.AccountMapper;
import com.pro.pass.repository.AccountRepository;
import com.pro.pass.repository.PasswordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {


    private final AccountRepository accountRepository;
    private final PasswordRepository passwordRepository;
    private final AccountMapper accountMapper;
    private final PasswordEncoder passwordEncoder;

    // ---------------------- SAVE (SALVA IL SINGOLO ACCOUNT) ----------------------

    public AccountDTO createAccountDTO (AccountRequestDTO accountRequestDTO) {
        if (accountRequestDTO == null) {
            throw new RichiestaErrataCampiNonInseritiException("AccountDTO non può essere nullo");
        }

        if (accountRequestDTO.getUsername() == null || accountRequestDTO.getUsername().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Username non può essere nullo o vuoto");
        }

        if (accountRequestDTO.getPassword() == null || accountRequestDTO.getPassword().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Password non può essere nulla o vuota");
        }

        if (accountRequestDTO.getEmail() == null || accountRequestDTO.getEmail().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Email non può essere nulla o vuota");
        }

        if (accountRepository.existsByEmail(accountRequestDTO.getEmail())) {
            throw new EmailGiaEsistenteException("Email " + accountRequestDTO.getEmail() + " già in uso");
        }

        Account accountDaSalvare = accountMapper.toEntity(accountRequestDTO);
        accountDaSalvare.setPassword(passwordEncoder.encode(accountRequestDTO.getPassword()));
        accountDaSalvare.setCreazioneAccount(LocalDate.now());

        Account accountSalvato = accountRepository.save(accountDaSalvare);
        return accountMapper.toDTO(accountSalvato);
    }

    // ---------------------- GET (OTTENERE IL SINGOLO ACCOUNT) ----------------------

    public AccountDTO getAccountDTOById (Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNonEsistenteException("Account con ID " + id + " non trovato"));
        return accountMapper.toDTO(account);
    }

    // ---------------------- DELETE (ELIMINARE IL SINGOLO ACCOUNT) ----------------------

    // Prima le password dell'account (chiave esterna), poi l'account: nella stessa transazione.
    @Transactional
    public void deleteAccountById (Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNonEsistenteException("Account con ID " + id + " non trovato"));
        passwordRepository.deleteByIdAccountId(id);
        accountRepository.delete(account);
    }

    // ---------------------- UPDATE (AGGIORNARE IL SINGOLO ACCOUNT) ----------------------

    public AccountDTO updateAccountDTO (Long id, AccountRequestDTO accountRequestDTO) {
        if (accountRequestDTO == null) {
            throw new RichiestaErrataCampiNonInseritiException("AccountDTO non può essere nullo");
        }

        Account accountEsistente = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNonEsistenteException("Account con ID " + id + " non trovato"));

        if (accountRequestDTO.getUsername() != null && !accountRequestDTO.getUsername().isEmpty()) {
            accountEsistente.setUsername(accountRequestDTO.getUsername());
        }

        if (accountRequestDTO.getPassword() != null && !accountRequestDTO.getPassword().isEmpty()) {
            accountEsistente.setPassword(passwordEncoder.encode(accountRequestDTO.getPassword()));
        }

        if (accountRequestDTO.getEmail() != null && !accountRequestDTO.getEmail().isEmpty()
                && !accountRequestDTO.getEmail().equals(accountEsistente.getEmail())) {
            if (accountRepository.existsByEmail(accountRequestDTO.getEmail())) {
                throw new EmailGiaEsistenteException("Email " + accountRequestDTO.getEmail() + " già in uso");
            }
            accountEsistente.setEmail(accountRequestDTO.getEmail());
        }

        Account accountAggiornato = accountRepository.save(accountEsistente);
        return accountMapper.toDTO(accountAggiornato);
    }

    // ---------------------- CHECK (VERIFICA SE L'ACCOUNT ESISTE) ----------------------

    public boolean accountExistsByEmail (String email) {
        if (email == null || email.isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Email non può essere nulla o vuota");
        }
        return accountRepository.existsByEmail(email);
    }

    // ---------------------- LOGIN (VERIFICA LE CREDENZIALI) ----------------------

    public AccountDTO autentica (String email, String password) {
        if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Email e password non possono essere nulle o vuote");
        }

        Account account = accountRepository.findByEmail(email);

        if (account == null) {
            // Stesso lavoro (Argon2 è lento di proposito) che faremmo con un account vero:
            // così il tempo di risposta non rivela se l'email è registrata.
            passwordEncoder.encode(password);
            throw new CredenzialiNonValideException("Email o password non corretti");
        }

        if (!passwordEncoder.matches(password, account.getPassword())) {
            throw new CredenzialiNonValideException("Email o password non corretti");
        }

        return accountMapper.toDTO(account);
    }
}

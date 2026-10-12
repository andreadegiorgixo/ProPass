package com.pro.pass.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pro.pass.dto.PasswordDTO;
import com.pro.pass.entity.Account;
import com.pro.pass.entity.Password;
import com.pro.pass.exception.AccountException.AccountNonEsistenteException;
import com.pro.pass.exception.AccountException.RichiestaErrataCampiNonInseritiException;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteIdException;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteLinkException;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteNomePassword;
import com.pro.pass.exception.PasswordException.PasswordNonTrovataTramiteUsernameException;
import com.pro.pass.mapper.PasswordMapper;
import com.pro.pass.repository.AccountRepository;
import com.pro.pass.repository.PasswordRepository;

import lombok.RequiredArgsConstructor;

// Tutti i metodi ricevono l'id dell'account in sessione e cercano solo tra le sue password:
// una password di un altro account risulta "non trovata", come se non esistesse.
@Service
@RequiredArgsConstructor
public class PasswordService {

    private final PasswordRepository passwordRepository;
    private final AccountRepository accountRepository;
    private final PasswordMapper passwordMapper;

    // ---------------------- SAVE (SALVA LA SINGOLA PASSWORD) ----------------------

    public PasswordDTO savePassword(Long accountId, PasswordDTO passwordDTO) {
        controllaCampiObbligatori(passwordDTO);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNonEsistenteException("Account con ID " + accountId + " non trovato"));

        // Proprietario e data di creazione li decide il server, non il client.
        Password password = passwordMapper.toEntity(passwordDTO);
        password.setIdAccount(account);
        password.setCreazionePassword(LocalDate.now());

        Password savedPassword = passwordRepository.save(password);
        return passwordMapper.toDTO(savedPassword);
    }

    // ---------------------- GET (OTTENERE TUTTE LE PASSWORD DELL'ACCOUNT, ORDINATE PER NOME) ----------------------

    public List<PasswordDTO> getAllPasswords(Long accountId) {
        return passwordMapper.toDTOList(passwordRepository.findByIdAccountIdOrderByNomePasswordAsc(accountId));
    }

    // ---------------------- GET (OTTENERE LA SINGOLA PASSWORD) ----------------------

    public PasswordDTO getPasswordById(Long accountId, Long id) {
        Password password = passwordRepository.findByIdAndIdAccountId(id, accountId)
                .orElseThrow(() -> new PasswordNonTrovataTramiteIdException("Password non trovata con l'id: " + id));
        return passwordMapper.toDTO(password);
    }

    // ---------------------- DELETE (ELIMINA LA SINGOLA PASSWORD) ----------------------

    public void deletePasswordById(Long accountId, Long id) {
        Password password = passwordRepository.findByIdAndIdAccountId(id, accountId)
                .orElseThrow(() -> new PasswordNonTrovataTramiteIdException("Password non trovata con l'id: " + id));
        passwordRepository.delete(password);
    }

    // ---------------------- UPDATE (AGGIORNA LA SINGOLA PASSWORD) ----------------------

    public PasswordDTO updatePassword (Long accountId, Long id, PasswordDTO passwordDTO) {
        controllaCampiObbligatori(passwordDTO);

        Password existingPassword = passwordRepository.findByIdAndIdAccountId(id, accountId)
                .orElseThrow(() -> new PasswordNonTrovataTramiteIdException("Password non trovata con l'id: " + id));

        // creazionePassword e idAccount non si toccano: restano quelli del salvataggio.
        existingPassword.setNomePassword(passwordDTO.getNomePassword());
        existingPassword.setPassword(passwordDTO.getPassword());
        existingPassword.setLink(passwordDTO.getLink());
        existingPassword.setUsername(passwordDTO.getUsername());
        existingPassword.setNote(passwordDTO.getNote());

        Password updatedPassword = passwordRepository.save(existingPassword);
        return passwordMapper.toDTO(updatedPassword);
    }

    // ---------------------- GET (OTTENERE LE PASSWORD PER LINK) ----------------------

    public List<PasswordDTO> getPasswordByLink(Long accountId, String link) {
        List<Password> passwords = passwordRepository.findByLinkContainingIgnoreCaseAndIdAccountId(link, accountId);
        if (passwords.isEmpty()) {
            throw new PasswordNonTrovataTramiteLinkException("Password non trovata con il link: " + link);
        }
        return passwordMapper.toDTOList(passwords);
    }

    // ---------------------- GET (OTTENERE LE PASSWORD PER USERNAME) ----------------------

    public List<PasswordDTO> getPasswordByUsername(Long accountId, String username) {
        List<Password> passwords = passwordRepository.findByUsernameContainingIgnoreCaseAndIdAccountId(username, accountId);
        if (passwords.isEmpty()) {
            throw new PasswordNonTrovataTramiteUsernameException("Password non trovata con lo username: " + username);
        }
        return passwordMapper.toDTOList(passwords);
    }

    // ---------------------- GET (OTTENERE LE PASSWORD PER NOME PASSWORD) ----------------------

    public List<PasswordDTO> getPasswordByNomePassword(Long accountId, String nomePassword) {
        List<Password> passwords = passwordRepository.findByNomePasswordContainingIgnoreCaseAndIdAccountId(nomePassword, accountId);
        if (passwords.isEmpty()) {
            throw new PasswordNonTrovataTramiteNomePassword("Password non trovata con il nome della password: " + nomePassword);
        }
        return passwordMapper.toDTOList(passwords);
    }

    // ---------------------- CHECK (CAMPI OBBLIGATORI, LE NOTE SONO FACOLTATIVE) ----------------------

    private void controllaCampiObbligatori(PasswordDTO passwordDTO) {
        if (passwordDTO == null) {
            throw new RichiestaErrataCampiNonInseritiException("PasswordDTO non può essere nullo");
        }

        if (passwordDTO.getNomePassword() == null || passwordDTO.getNomePassword().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Nome della password non può essere nullo o vuoto");
        }

        if (passwordDTO.getPassword() == null || passwordDTO.getPassword().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Password non può essere nulla o vuota");
        }

        if (passwordDTO.getLink() == null || passwordDTO.getLink().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Link non può essere nullo o vuoto");
        }

        if (passwordDTO.getUsername() == null || passwordDTO.getUsername().isEmpty()) {
            throw new RichiestaErrataCampiNonInseritiException("Username non può essere nullo o vuoto");
        }
    }
}

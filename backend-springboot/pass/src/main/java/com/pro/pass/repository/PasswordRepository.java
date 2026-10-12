package com.pro.pass.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pro.pass.entity.Password;

// "IdAccountId" = campo idAccount della Password, poi id dell'Account: ogni ricerca è limitata a un account.
// Link, username e nome non sono univoci, quindi le ricerche restituiscono una lista.
// Le ricerche per testo trovano le password che CONTENGONO il testo, senza distinguere maiuscole e minuscole.
public interface PasswordRepository extends JpaRepository<Password, Long> {
    Optional<Password> findByIdAndIdAccountId(Long id, Long accountId);
    List<Password> findByIdAccountIdOrderByNomePasswordAsc(Long accountId);
    List<Password> findByLinkContainingIgnoreCaseAndIdAccountId(String link, Long accountId);
    List<Password> findByUsernameContainingIgnoreCaseAndIdAccountId(String username, Long accountId);
    List<Password> findByNomePasswordContainingIgnoreCaseAndIdAccountId(String nomePassword, Long accountId);
    void deleteByIdAccountId(Long accountId);
}

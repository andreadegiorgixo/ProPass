package com.pro.pass.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pro.pass.entity.Account;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Account findByEmail(String email);
    boolean existsByEmail(String email);
}

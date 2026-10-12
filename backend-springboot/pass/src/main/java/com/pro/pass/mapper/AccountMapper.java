package com.pro.pass.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.pro.pass.dto.AccountDTO;
import com.pro.pass.dto.AccountRequestDTO;
import com.pro.pass.entity.Account;

@Mapper (componentModel = "spring", uses = PasswordMapper.class)
public interface AccountMapper {

    AccountDTO toDTO(Account account);

    List<AccountDTO> toDTOList(List<Account> accounts);

    @Mapping (target = "id", ignore = true)
    @Mapping (target = "creazioneAccount", ignore = true)
    Account toEntity(AccountRequestDTO accountRequestDTO);
}
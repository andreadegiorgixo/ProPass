package com.pro.pass.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.pro.pass.dto.PasswordDTO;
import com.pro.pass.entity.Password;

@Mapper (componentModel = "spring")
public interface PasswordMapper {

    PasswordDTO toDTO(Password password);

    List<PasswordDTO> toDTOList(List<Password> passwords);

    @Mapping (target = "id", ignore = true)
    @Mapping (target = "creazionePassword", ignore = true)
    @Mapping (target = "idAccount", ignore = true)
    Password toEntity(PasswordDTO passwordDTO);
}

-- Schema iniziale di ProPass: tabelle account e password.
-- Allineato alle entity Account e Password. Hibernate lo controlla a ogni avvio (ddl-auto=validate).
-- Nomi delle colonne: quelli che Spring Boot ricava dai campi (creazioneAccount -> creazione_account).
-- Non modificare questo file dopo l'esecuzione: ogni cambio di schema va in un nuovo V2__...sql.

CREATE TABLE account (
    id                 NUMBER(19, 0)       GENERATED ALWAYS AS IDENTITY,
    username           VARCHAR2(255 CHAR)  NOT NULL,
    email              VARCHAR2(255 CHAR)  NOT NULL,
    password           VARCHAR2(255 CHAR)  NOT NULL,
    creazione_account  DATE                NOT NULL,
    CONSTRAINT pk_account PRIMARY KEY (id),
    CONSTRAINT uq_account_email UNIQUE (email)
);

-- link e note sono piu' larghi del default 255 delle entity: un URL con parametri o un
-- appunto superano facilmente i 255 caratteri e darebbero ORA-12899 (errore 500 lato API).
-- note e' facoltativa: Oracle salva la stringa vuota come NULL.
CREATE TABLE password (
    id                  NUMBER(19, 0)        GENERATED ALWAYS AS IDENTITY,
    nome_password       VARCHAR2(255 CHAR)   NOT NULL,
    password            VARCHAR2(255 CHAR)   NOT NULL,
    link                VARCHAR2(1000 CHAR)  NOT NULL,
    username            VARCHAR2(255 CHAR)   NOT NULL,
    note                VARCHAR2(1000 CHAR),
    creazione_password  DATE                 NOT NULL,
    account_id          NUMBER(19, 0)        NOT NULL,
    CONSTRAINT pk_password PRIMARY KEY (id),
    CONSTRAINT fk_password_account FOREIGN KEY (account_id) REFERENCES account (id)
);

-- Oracle non indicizza da solo le chiavi esterne; ogni query filtra per account_id.
CREATE INDEX idx_password_account_id ON password (account_id);

-- Controle de Estoque - esquema do banco (MySQL 8.0.16+)

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario       VARCHAR(40) NOT NULL,
  senha_hash    VARCHAR(255) NOT NULL,
  papel         VARCHAR(20) NOT NULL DEFAULT 'usuario',
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (usuario),
  CONSTRAINT chk_usuarios_papel CHECK (papel IN ('admin', 'usuario'))
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash    CHAR(64) NOT NULL,
  usuario_id    INT UNSIGNED NOT NULL,
  expira_em     DATETIME NOT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_sessoes_expira_em (expira_em),
  CONSTRAINT fk_sessoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS produtos (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome               VARCHAR(100) NOT NULL,
  categoria          VARCHAR(50) NOT NULL,
  codigo             VARCHAR(40) NOT NULL,
  cor                VARCHAR(30),
  tamanho            VARCHAR(20),
  modelo             VARCHAR(50),
  preco              DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
  quantidade_estoque INT NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
  estoque_minimo     INT NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  criado_em          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produtos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS movimentacoes (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id        INT UNSIGNED NOT NULL,
  tipo              VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade        INT NOT NULL CHECK (quantidade > 0),
  estoque_anterior  INT NOT NULL CHECK (estoque_anterior >= 0),
  estoque_posterior INT NOT NULL CHECK (estoque_posterior >= 0),
  data              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimentacoes_produto (produto_id),
  KEY idx_movimentacoes_data (data),
  CONSTRAINT fk_movimentacoes_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

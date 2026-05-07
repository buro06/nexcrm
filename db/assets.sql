CREATE TABLE IF NOT EXISTS assets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tag_number    VARCHAR(20) UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  make          VARCHAR(100) NOT NULL,
  model_number  VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  notes         TEXT,
  customer_id   INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

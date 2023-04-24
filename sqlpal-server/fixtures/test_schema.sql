-- initial test database
CREATE TABLE
  customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );

CREATE TABLE
  products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );

CREATE TABLE
  orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers (id),
    product_id INTEGER NOT NULL REFERENCES products (id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );

INSERT INTO
  customers (name, email)
VALUES
  ('John Doe', 'john.doe@example.com'),
  ('Jane Smith', 'jane.smith@example.com'),
  ('Bob Johnson', 'bob.johnson@example.com');

INSERT INTO
  products (name, price)
VALUES
  ('Widget', 9.99),
  ('Gadget', 19.99),
  ('Thingamajig', 29.99);

INSERT INTO
  orders (customer_id, product_id, quantity)
VALUES
  (1, 1, 2),
  (2, 2, 1),
  (3, 3, 3),
  (1, 2, 1),
  (2, 3, 2);

Prerequisites : npm, nodejs, redis, php, postgreSQL

npm install
composer install

in postgreSQL :
create an user named rooms with its associated rooms table.
run the following SQL to create the table and the associated trigger:

CREATE TABLE room
(
  id serial NOT NULL,
  name text NOT NULL,
  nb_students integer NOT NULL,
  temperature integer NOT NULL,
  CONSTRAINT room_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
DECLARE
BEGIN
  PERFORM pg_notify('watchers', TG_TABLE_NAME || ',id,' || NEW.id );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watched_table_trigger
  AFTER INSERT OR UPDATE
  ON room
  FOR EACH ROW
  EXECUTE PROCEDURE notify_trigger();

- launch 3 terminals, run "redis-server" in the first one

- run "php -S localhost:XXXX" in the second one

- run "npm start" in the third.

You're done !

You can now access your app via http://localhost:XXXX/ You can login to this page on your php server using user "Bob" pass "123", once logged in, you will get a sessionId in a cookie, this sessionId will be stored in redis in order to be accessible by node.js. You will then be redirected to your node.js served page and will see the content of the "room" table.

You can open a terminal and play with the room table to see it instantly updated in the browser using the notify trigger and the Server Sent Event !


if you want to test it add new rooms while looking at the node.js page.

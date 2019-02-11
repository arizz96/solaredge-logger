CREATE DATABASE energy_monitor_logs;

CREATE TABLE solarpower_logs (
  "id" serial primary key,
  "value" decimal,
  "created_at" timestamp NOT NULL
);

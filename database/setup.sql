CREATE SEQUENCE IF NOT EXISTS public.draws_draw_counter_seq
INCREMENT 1
START 1
MINVALUE 1
MAXVALUE 2147483647
CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.distributions_id_seq
INCREMENT 1
START 1
MINVALUE 1
MAXVALUE 2147483647
CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.draws_id_seq
INCREMENT 1
START 1
MINVALUE 1
MAXVALUE 2147483647
CACHE 1;

CREATE TABLE IF NOT EXISTS public.draws
(
    id integer NOT NULL DEFAULT nextval('draws_id_seq'::regclass),
    date_start timestamp with time zone NOT NULL,
    date_end timestamp with time zone NOT NULL,
    total_collected numeric(20,2),
    fee numeric(5,2),
    winner_public_key text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) COLLATE pg_catalog."default" DEFAULT 'Pending'::character varying,
    draw_counter integer NOT NULL DEFAULT nextval('draws_draw_counter_seq'::regclass),
    CONSTRAINT draws_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.distributions
(
    id integer NOT NULL DEFAULT nextval('distributions_id_seq'::regclass),
    draw_id integer,
    public_key character varying(255) COLLATE pg_catalog."default" NOT NULL,
    prize numeric(18,8) NOT NULL,
    fee_paid numeric(18,8) NOT NULL,
    transaction_datetime timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    hash character varying(255) COLLATE pg_catalog."default",
    status character varying(100) COLLATE pg_catalog."default",
    retry integer DEFAULT 1,
    error_message character varying COLLATE pg_catalog."default",
    hash_origin character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT distributions_pkey PRIMARY KEY (id),
    CONSTRAINT distributions_draw_id_fkey FOREIGN KEY (draw_id)
        REFERENCES public.draws (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE USER dag_user WITH PASSWORD 'INPUT_YOUR_PASSWORD';

GRANT SELECT,UPDATE, INSERT ON TABLE draws TO dag_user;

GRANT SELECT,UPDATE, INSERT ON TABLE distributions TO dag_user;

GRANT USAGE, SELECT ON SEQUENCE public.draws_draw_counter_seq TO dag_user;

GRANT USAGE, SELECT ON SEQUENCE public.distributions_id_seq TO dag_user;

GRANT USAGE, SELECT ON SEQUENCE public.draws_id_seq TO dag_user;

DO $$
DECLARE
    start_date TIMESTAMPTZ := (NOW() - INTERVAL '1 day')::DATE + INTERVAL '21 hours 00 minutes 01 seconds';
    end_date TIMESTAMPTZ;
BEGIN
    FOR i IN 0..60 LOOP 
        end_date := start_date + INTERVAL '23 hours 59 minutes 59 seconds';

        INSERT INTO Draws (
            date_start,
            date_end,
            total_collected,
            fee,
            winner_public_key
        ) VALUES (
            start_date,
            end_date,
            NULL, 
            NULL, 
            NULL  
        );

        start_date := start_date + INTERVAL '1 day';
    END LOOP;
END $$;

UPDATE Draws SET status = 'Running' WHERE draw_counter = 1;
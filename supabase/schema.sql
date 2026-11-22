-- Base de données de l'application NSA (à coller une seule fois dans Supabase > SQL Editor > Run)

-- 1. Formatrices autorisées à voir les résultats
create table if not exists public.formatrices (email text primary key);
alter table public.formatrices enable row level security;
create or replace function public.est_formatrice() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.formatrices where email = auth.jwt() ->> 'email');
$$;

-- 2. Résultats des élèves
create table if not exists public.resultats (
  id text primary key,
  created_at timestamptz not null default now(),
  eleve text not null check (char_length(eleve) between 1 and 40),
  appareil text not null check (char_length(appareil) <= 40),
  semaine int not null check (semaine between 1 and 60),
  activite text not null check (char_length(activite) <= 40),
  titre text check (char_length(titre) <= 120),
  score int, total int, duree_s int,
  reponses jsonb,
  audio_path text check (char_length(audio_path) <= 200)
);
alter table public.resultats enable row level security;
drop policy if exists "eleves envoient" on public.resultats;
drop policy if exists "formatrice lit" on public.resultats;
drop policy if exists "formatrice supprime" on public.resultats;
create policy "eleves envoient" on public.resultats for insert to anon, authenticated with check (true);
create policy "formatrice lit" on public.resultats for select to authenticated using (public.est_formatrice());
create policy "formatrice supprime" on public.resultats for delete to authenticated using (public.est_formatrice());

-- 3. Fichiers audio : "voix" (votre voix, lisible par tous) et "eleves" (enregistrements des élèves, privés)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voix', 'voix', true, 5242880, array['audio/mp4','audio/webm','audio/mpeg','audio/ogg','audio/x-m4a','application/json']),
       ('eleves', 'eleves', false, 10485760, array['audio/mp4','audio/webm','audio/ogg','audio/x-m4a'])
on conflict (id) do nothing;

drop policy if exists "voix formatrice lit" on storage.objects;
drop policy if exists "voix formatrice ecrit" on storage.objects;
drop policy if exists "voix formatrice modifie" on storage.objects;
drop policy if exists "voix formatrice supprime" on storage.objects;
drop policy if exists "eleves envoient audio" on storage.objects;
drop policy if exists "formatrice ecoute eleves" on storage.objects;
create policy "voix formatrice lit" on storage.objects for select to authenticated using (bucket_id = 'voix' and public.est_formatrice());
create policy "voix formatrice ecrit" on storage.objects for insert to authenticated with check (bucket_id = 'voix' and public.est_formatrice());
create policy "voix formatrice modifie" on storage.objects for update to authenticated using (bucket_id = 'voix' and public.est_formatrice());
create policy "voix formatrice supprime" on storage.objects for delete to authenticated using (bucket_id = 'voix' and public.est_formatrice());
create policy "eleves envoient audio" on storage.objects for insert to anon, authenticated with check (bucket_id = 'eleves');
create policy "formatrice ecoute eleves" on storage.objects for select to authenticated using (bucket_id = 'eleves' and public.est_formatrice());

-- 4. Votre adresse e-mail de formatrice (remplacez par la vôtre, entre les apostrophes)
insert into public.formatrices (email) values ('VOTRE_ADRESSE_EMAIL') on conflict do nothing;

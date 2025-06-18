
alter policy "Allow delete for authenticated users"
on "public"."local_events"
to public
using (
   (auth.role() = 'authenticated'::text)
);


alter policy "Allow update for authenticated users"
on "public"."events"
to public
using (
      (auth.role() = 'authenticated'::text)
with check (
      (auth.role() = 'authenticated'::text)
);


alter policy "Allow insert for authenticated users"
on "public"."local_events"
to public
with check (
   (auth.role() = 'authenticated'::text)
);


alter policy "Events are viewable by everyone"
on "public"."local_events"
to public
using (
   true
);
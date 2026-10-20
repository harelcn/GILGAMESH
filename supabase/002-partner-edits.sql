-- Harel 20.10.2026: the partner may cut (K) and take out (Q/W/Delete) as proposals.
-- The room keeps each item's author; only the owner sends to Claude (submissions stay owner-only).
drop policy if exists "owner writes edits" on public.edit_states;
drop policy if exists "members write edits" on public.edit_states;
create policy "members write edits" on public.edit_states for insert with check (public.is_member());
drop policy if exists "owner updates edits" on public.edit_states;
drop policy if exists "members update edits" on public.edit_states;
create policy "members update edits" on public.edit_states for update using (public.is_member());

drop policy "Anyone can read homepage cache" on "public"."homepage_cache";

drop policy "Service role can manage homepage cache" on "public"."homepage_cache";

drop policy "Users can insert search analytics" on "public"."search_analytics";

drop policy "Users can read own search analytics" on "public"."search_analytics";

drop policy "Anyone can read sync state" on "public"."sync_state";

drop policy "Service role can manage sync state" on "public"."sync_state";

revoke delete on table "public"."artists" from "anon";

revoke insert on table "public"."artists" from "anon";

revoke references on table "public"."artists" from "anon";

revoke select on table "public"."artists" from "anon";

revoke trigger on table "public"."artists" from "anon";

revoke truncate on table "public"."artists" from "anon";

revoke update on table "public"."artists" from "anon";

revoke delete on table "public"."artists" from "authenticated";

revoke insert on table "public"."artists" from "authenticated";

revoke references on table "public"."artists" from "authenticated";

revoke select on table "public"."artists" from "authenticated";

revoke trigger on table "public"."artists" from "authenticated";

revoke truncate on table "public"."artists" from "authenticated";

revoke update on table "public"."artists" from "authenticated";

revoke delete on table "public"."artists" from "service_role";

revoke insert on table "public"."artists" from "service_role";

revoke references on table "public"."artists" from "service_role";

revoke select on table "public"."artists" from "service_role";

revoke trigger on table "public"."artists" from "service_role";

revoke truncate on table "public"."artists" from "service_role";

revoke update on table "public"."artists" from "service_role";

revoke delete on table "public"."homepage_cache" from "anon";

revoke insert on table "public"."homepage_cache" from "anon";

revoke references on table "public"."homepage_cache" from "anon";

revoke select on table "public"."homepage_cache" from "anon";

revoke trigger on table "public"."homepage_cache" from "anon";

revoke truncate on table "public"."homepage_cache" from "anon";

revoke update on table "public"."homepage_cache" from "anon";

revoke delete on table "public"."homepage_cache" from "authenticated";

revoke insert on table "public"."homepage_cache" from "authenticated";

revoke references on table "public"."homepage_cache" from "authenticated";

revoke select on table "public"."homepage_cache" from "authenticated";

revoke trigger on table "public"."homepage_cache" from "authenticated";

revoke truncate on table "public"."homepage_cache" from "authenticated";

revoke update on table "public"."homepage_cache" from "authenticated";

revoke delete on table "public"."homepage_cache" from "service_role";

revoke insert on table "public"."homepage_cache" from "service_role";

revoke references on table "public"."homepage_cache" from "service_role";

revoke select on table "public"."homepage_cache" from "service_role";

revoke trigger on table "public"."homepage_cache" from "service_role";

revoke truncate on table "public"."homepage_cache" from "service_role";

revoke update on table "public"."homepage_cache" from "service_role";

revoke delete on table "public"."played_setlist_songs" from "anon";

revoke insert on table "public"."played_setlist_songs" from "anon";

revoke references on table "public"."played_setlist_songs" from "anon";

revoke select on table "public"."played_setlist_songs" from "anon";

revoke trigger on table "public"."played_setlist_songs" from "anon";

revoke truncate on table "public"."played_setlist_songs" from "anon";

revoke update on table "public"."played_setlist_songs" from "anon";

revoke delete on table "public"."played_setlist_songs" from "authenticated";

revoke insert on table "public"."played_setlist_songs" from "authenticated";

revoke references on table "public"."played_setlist_songs" from "authenticated";

revoke select on table "public"."played_setlist_songs" from "authenticated";

revoke trigger on table "public"."played_setlist_songs" from "authenticated";

revoke truncate on table "public"."played_setlist_songs" from "authenticated";

revoke update on table "public"."played_setlist_songs" from "authenticated";

revoke delete on table "public"."played_setlist_songs" from "service_role";

revoke insert on table "public"."played_setlist_songs" from "service_role";

revoke references on table "public"."played_setlist_songs" from "service_role";

revoke select on table "public"."played_setlist_songs" from "service_role";

revoke trigger on table "public"."played_setlist_songs" from "service_role";

revoke truncate on table "public"."played_setlist_songs" from "service_role";

revoke update on table "public"."played_setlist_songs" from "service_role";

revoke delete on table "public"."played_setlists" from "anon";

revoke insert on table "public"."played_setlists" from "anon";

revoke references on table "public"."played_setlists" from "anon";

revoke select on table "public"."played_setlists" from "anon";

revoke trigger on table "public"."played_setlists" from "anon";

revoke truncate on table "public"."played_setlists" from "anon";

revoke update on table "public"."played_setlists" from "anon";

revoke delete on table "public"."played_setlists" from "authenticated";

revoke insert on table "public"."played_setlists" from "authenticated";

revoke references on table "public"."played_setlists" from "authenticated";

revoke select on table "public"."played_setlists" from "authenticated";

revoke trigger on table "public"."played_setlists" from "authenticated";

revoke truncate on table "public"."played_setlists" from "authenticated";

revoke update on table "public"."played_setlists" from "authenticated";

revoke delete on table "public"."played_setlists" from "service_role";

revoke insert on table "public"."played_setlists" from "service_role";

revoke references on table "public"."played_setlists" from "service_role";

revoke select on table "public"."played_setlists" from "service_role";

revoke trigger on table "public"."played_setlists" from "service_role";

revoke truncate on table "public"."played_setlists" from "service_role";

revoke update on table "public"."played_setlists" from "service_role";

revoke delete on table "public"."search_analytics" from "anon";

revoke insert on table "public"."search_analytics" from "anon";

revoke references on table "public"."search_analytics" from "anon";

revoke select on table "public"."search_analytics" from "anon";

revoke trigger on table "public"."search_analytics" from "anon";

revoke truncate on table "public"."search_analytics" from "anon";

revoke update on table "public"."search_analytics" from "anon";

revoke delete on table "public"."search_analytics" from "authenticated";

revoke insert on table "public"."search_analytics" from "authenticated";

revoke references on table "public"."search_analytics" from "authenticated";

revoke select on table "public"."search_analytics" from "authenticated";

revoke trigger on table "public"."search_analytics" from "authenticated";

revoke truncate on table "public"."search_analytics" from "authenticated";

revoke update on table "public"."search_analytics" from "authenticated";

revoke delete on table "public"."search_analytics" from "service_role";

revoke insert on table "public"."search_analytics" from "service_role";

revoke references on table "public"."search_analytics" from "service_role";

revoke select on table "public"."search_analytics" from "service_role";

revoke trigger on table "public"."search_analytics" from "service_role";

revoke truncate on table "public"."search_analytics" from "service_role";

revoke update on table "public"."search_analytics" from "service_role";

revoke delete on table "public"."setlist_songs" from "anon";

revoke insert on table "public"."setlist_songs" from "anon";

revoke references on table "public"."setlist_songs" from "anon";

revoke select on table "public"."setlist_songs" from "anon";

revoke trigger on table "public"."setlist_songs" from "anon";

revoke truncate on table "public"."setlist_songs" from "anon";

revoke update on table "public"."setlist_songs" from "anon";

revoke delete on table "public"."setlist_songs" from "authenticated";

revoke insert on table "public"."setlist_songs" from "authenticated";

revoke references on table "public"."setlist_songs" from "authenticated";

revoke select on table "public"."setlist_songs" from "authenticated";

revoke trigger on table "public"."setlist_songs" from "authenticated";

revoke truncate on table "public"."setlist_songs" from "authenticated";

revoke update on table "public"."setlist_songs" from "authenticated";

revoke delete on table "public"."setlist_songs" from "service_role";

revoke insert on table "public"."setlist_songs" from "service_role";

revoke references on table "public"."setlist_songs" from "service_role";

revoke select on table "public"."setlist_songs" from "service_role";

revoke trigger on table "public"."setlist_songs" from "service_role";

revoke truncate on table "public"."setlist_songs" from "service_role";

revoke update on table "public"."setlist_songs" from "service_role";

revoke delete on table "public"."setlists" from "anon";

revoke insert on table "public"."setlists" from "anon";

revoke references on table "public"."setlists" from "anon";

revoke select on table "public"."setlists" from "anon";

revoke trigger on table "public"."setlists" from "anon";

revoke truncate on table "public"."setlists" from "anon";

revoke update on table "public"."setlists" from "anon";

revoke delete on table "public"."setlists" from "authenticated";

revoke insert on table "public"."setlists" from "authenticated";

revoke references on table "public"."setlists" from "authenticated";

revoke select on table "public"."setlists" from "authenticated";

revoke trigger on table "public"."setlists" from "authenticated";

revoke truncate on table "public"."setlists" from "authenticated";

revoke update on table "public"."setlists" from "authenticated";

revoke delete on table "public"."setlists" from "service_role";

revoke insert on table "public"."setlists" from "service_role";

revoke references on table "public"."setlists" from "service_role";

revoke select on table "public"."setlists" from "service_role";

revoke trigger on table "public"."setlists" from "service_role";

revoke truncate on table "public"."setlists" from "service_role";

revoke update on table "public"."setlists" from "service_role";

revoke delete on table "public"."shows" from "anon";

revoke insert on table "public"."shows" from "anon";

revoke references on table "public"."shows" from "anon";

revoke select on table "public"."shows" from "anon";

revoke trigger on table "public"."shows" from "anon";

revoke truncate on table "public"."shows" from "anon";

revoke update on table "public"."shows" from "anon";

revoke delete on table "public"."shows" from "authenticated";

revoke insert on table "public"."shows" from "authenticated";

revoke references on table "public"."shows" from "authenticated";

revoke select on table "public"."shows" from "authenticated";

revoke trigger on table "public"."shows" from "authenticated";

revoke truncate on table "public"."shows" from "authenticated";

revoke update on table "public"."shows" from "authenticated";

revoke delete on table "public"."shows" from "service_role";

revoke insert on table "public"."shows" from "service_role";

revoke references on table "public"."shows" from "service_role";

revoke select on table "public"."shows" from "service_role";

revoke trigger on table "public"."shows" from "service_role";

revoke truncate on table "public"."shows" from "service_role";

revoke update on table "public"."shows" from "service_role";

revoke delete on table "public"."songs" from "anon";

revoke insert on table "public"."songs" from "anon";

revoke references on table "public"."songs" from "anon";

revoke select on table "public"."songs" from "anon";

revoke trigger on table "public"."songs" from "anon";

revoke truncate on table "public"."songs" from "anon";

revoke update on table "public"."songs" from "anon";

revoke delete on table "public"."songs" from "authenticated";

revoke insert on table "public"."songs" from "authenticated";

revoke references on table "public"."songs" from "authenticated";

revoke select on table "public"."songs" from "authenticated";

revoke trigger on table "public"."songs" from "authenticated";

revoke truncate on table "public"."songs" from "authenticated";

revoke update on table "public"."songs" from "authenticated";

revoke delete on table "public"."songs" from "service_role";

revoke insert on table "public"."songs" from "service_role";

revoke references on table "public"."songs" from "service_role";

revoke select on table "public"."songs" from "service_role";

revoke trigger on table "public"."songs" from "service_role";

revoke truncate on table "public"."songs" from "service_role";

revoke update on table "public"."songs" from "service_role";

revoke delete on table "public"."spatial_ref_sys" from "anon";

revoke insert on table "public"."spatial_ref_sys" from "anon";

revoke references on table "public"."spatial_ref_sys" from "anon";

revoke select on table "public"."spatial_ref_sys" from "anon";

revoke trigger on table "public"."spatial_ref_sys" from "anon";

revoke truncate on table "public"."spatial_ref_sys" from "anon";

revoke update on table "public"."spatial_ref_sys" from "anon";

revoke delete on table "public"."spatial_ref_sys" from "authenticated";

revoke insert on table "public"."spatial_ref_sys" from "authenticated";

revoke references on table "public"."spatial_ref_sys" from "authenticated";

revoke select on table "public"."spatial_ref_sys" from "authenticated";

revoke trigger on table "public"."spatial_ref_sys" from "authenticated";

revoke truncate on table "public"."spatial_ref_sys" from "authenticated";

revoke update on table "public"."spatial_ref_sys" from "authenticated";

revoke delete on table "public"."spatial_ref_sys" from "postgres";

revoke insert on table "public"."spatial_ref_sys" from "postgres";

revoke references on table "public"."spatial_ref_sys" from "postgres";

revoke select on table "public"."spatial_ref_sys" from "postgres";

revoke trigger on table "public"."spatial_ref_sys" from "postgres";

revoke truncate on table "public"."spatial_ref_sys" from "postgres";

revoke update on table "public"."spatial_ref_sys" from "postgres";

revoke delete on table "public"."spatial_ref_sys" from "service_role";

revoke insert on table "public"."spatial_ref_sys" from "service_role";

revoke references on table "public"."spatial_ref_sys" from "service_role";

revoke select on table "public"."spatial_ref_sys" from "service_role";

revoke trigger on table "public"."spatial_ref_sys" from "service_role";

revoke truncate on table "public"."spatial_ref_sys" from "service_role";

revoke update on table "public"."spatial_ref_sys" from "service_role";

revoke delete on table "public"."sync_history" from "anon";

revoke insert on table "public"."sync_history" from "anon";

revoke references on table "public"."sync_history" from "anon";

revoke select on table "public"."sync_history" from "anon";

revoke trigger on table "public"."sync_history" from "anon";

revoke truncate on table "public"."sync_history" from "anon";

revoke update on table "public"."sync_history" from "anon";

revoke delete on table "public"."sync_history" from "authenticated";

revoke insert on table "public"."sync_history" from "authenticated";

revoke references on table "public"."sync_history" from "authenticated";

revoke select on table "public"."sync_history" from "authenticated";

revoke trigger on table "public"."sync_history" from "authenticated";

revoke truncate on table "public"."sync_history" from "authenticated";

revoke update on table "public"."sync_history" from "authenticated";

revoke delete on table "public"."sync_history" from "service_role";

revoke insert on table "public"."sync_history" from "service_role";

revoke references on table "public"."sync_history" from "service_role";

revoke select on table "public"."sync_history" from "service_role";

revoke trigger on table "public"."sync_history" from "service_role";

revoke truncate on table "public"."sync_history" from "service_role";

revoke update on table "public"."sync_history" from "service_role";

revoke delete on table "public"."sync_state" from "anon";

revoke insert on table "public"."sync_state" from "anon";

revoke references on table "public"."sync_state" from "anon";

revoke select on table "public"."sync_state" from "anon";

revoke trigger on table "public"."sync_state" from "anon";

revoke truncate on table "public"."sync_state" from "anon";

revoke update on table "public"."sync_state" from "anon";

revoke delete on table "public"."sync_state" from "authenticated";

revoke insert on table "public"."sync_state" from "authenticated";

revoke references on table "public"."sync_state" from "authenticated";

revoke select on table "public"."sync_state" from "authenticated";

revoke trigger on table "public"."sync_state" from "authenticated";

revoke truncate on table "public"."sync_state" from "authenticated";

revoke update on table "public"."sync_state" from "authenticated";

revoke delete on table "public"."sync_state" from "service_role";

revoke insert on table "public"."sync_state" from "service_role";

revoke references on table "public"."sync_state" from "service_role";

revoke select on table "public"."sync_state" from "service_role";

revoke trigger on table "public"."sync_state" from "service_role";

revoke truncate on table "public"."sync_state" from "service_role";

revoke update on table "public"."sync_state" from "service_role";

revoke delete on table "public"."user_artists" from "anon";

revoke insert on table "public"."user_artists" from "anon";

revoke references on table "public"."user_artists" from "anon";

revoke select on table "public"."user_artists" from "anon";

revoke trigger on table "public"."user_artists" from "anon";

revoke truncate on table "public"."user_artists" from "anon";

revoke update on table "public"."user_artists" from "anon";

revoke delete on table "public"."user_artists" from "authenticated";

revoke insert on table "public"."user_artists" from "authenticated";

revoke references on table "public"."user_artists" from "authenticated";

revoke select on table "public"."user_artists" from "authenticated";

revoke trigger on table "public"."user_artists" from "authenticated";

revoke truncate on table "public"."user_artists" from "authenticated";

revoke update on table "public"."user_artists" from "authenticated";

revoke delete on table "public"."user_artists" from "service_role";

revoke insert on table "public"."user_artists" from "service_role";

revoke references on table "public"."user_artists" from "service_role";

revoke select on table "public"."user_artists" from "service_role";

revoke trigger on table "public"."user_artists" from "service_role";

revoke truncate on table "public"."user_artists" from "service_role";

revoke update on table "public"."user_artists" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

revoke delete on table "public"."venues" from "anon";

revoke insert on table "public"."venues" from "anon";

revoke references on table "public"."venues" from "anon";

revoke select on table "public"."venues" from "anon";

revoke trigger on table "public"."venues" from "anon";

revoke truncate on table "public"."venues" from "anon";

revoke update on table "public"."venues" from "anon";

revoke delete on table "public"."venues" from "authenticated";

revoke insert on table "public"."venues" from "authenticated";

revoke references on table "public"."venues" from "authenticated";

revoke select on table "public"."venues" from "authenticated";

revoke trigger on table "public"."venues" from "authenticated";

revoke truncate on table "public"."venues" from "authenticated";

revoke update on table "public"."venues" from "authenticated";

revoke delete on table "public"."venues" from "service_role";

revoke insert on table "public"."venues" from "service_role";

revoke references on table "public"."venues" from "service_role";

revoke select on table "public"."venues" from "service_role";

revoke trigger on table "public"."venues" from "service_role";

revoke truncate on table "public"."venues" from "service_role";

revoke update on table "public"."venues" from "service_role";

revoke delete on table "public"."vote_analytics" from "anon";

revoke insert on table "public"."vote_analytics" from "anon";

revoke references on table "public"."vote_analytics" from "anon";

revoke select on table "public"."vote_analytics" from "anon";

revoke trigger on table "public"."vote_analytics" from "anon";

revoke truncate on table "public"."vote_analytics" from "anon";

revoke update on table "public"."vote_analytics" from "anon";

revoke delete on table "public"."vote_analytics" from "authenticated";

revoke insert on table "public"."vote_analytics" from "authenticated";

revoke references on table "public"."vote_analytics" from "authenticated";

revoke select on table "public"."vote_analytics" from "authenticated";

revoke trigger on table "public"."vote_analytics" from "authenticated";

revoke truncate on table "public"."vote_analytics" from "authenticated";

revoke update on table "public"."vote_analytics" from "authenticated";

revoke delete on table "public"."vote_analytics" from "service_role";

revoke insert on table "public"."vote_analytics" from "service_role";

revoke references on table "public"."vote_analytics" from "service_role";

revoke select on table "public"."vote_analytics" from "service_role";

revoke trigger on table "public"."vote_analytics" from "service_role";

revoke truncate on table "public"."vote_analytics" from "service_role";

revoke update on table "public"."vote_analytics" from "service_role";

revoke delete on table "public"."votes" from "anon";

revoke insert on table "public"."votes" from "anon";

revoke references on table "public"."votes" from "anon";

revoke select on table "public"."votes" from "anon";

revoke trigger on table "public"."votes" from "anon";

revoke truncate on table "public"."votes" from "anon";

revoke update on table "public"."votes" from "anon";

revoke delete on table "public"."votes" from "authenticated";

revoke insert on table "public"."votes" from "authenticated";

revoke references on table "public"."votes" from "authenticated";

revoke select on table "public"."votes" from "authenticated";

revoke trigger on table "public"."votes" from "authenticated";

revoke truncate on table "public"."votes" from "authenticated";

revoke update on table "public"."votes" from "authenticated";

revoke delete on table "public"."votes" from "service_role";

revoke insert on table "public"."votes" from "service_role";

revoke references on table "public"."votes" from "service_role";

revoke select on table "public"."votes" from "service_role";

revoke trigger on table "public"."votes" from "service_role";

revoke truncate on table "public"."votes" from "service_role";

revoke update on table "public"."votes" from "service_role";

revoke delete on table "public"."zip_codes" from "anon";

revoke insert on table "public"."zip_codes" from "anon";

revoke references on table "public"."zip_codes" from "anon";

revoke select on table "public"."zip_codes" from "anon";

revoke trigger on table "public"."zip_codes" from "anon";

revoke truncate on table "public"."zip_codes" from "anon";

revoke update on table "public"."zip_codes" from "anon";

revoke delete on table "public"."zip_codes" from "authenticated";

revoke insert on table "public"."zip_codes" from "authenticated";

revoke references on table "public"."zip_codes" from "authenticated";

revoke select on table "public"."zip_codes" from "authenticated";

revoke trigger on table "public"."zip_codes" from "authenticated";

revoke truncate on table "public"."zip_codes" from "authenticated";

revoke update on table "public"."zip_codes" from "authenticated";

revoke delete on table "public"."zip_codes" from "service_role";

revoke insert on table "public"."zip_codes" from "service_role";

revoke references on table "public"."zip_codes" from "service_role";

revoke select on table "public"."zip_codes" from "service_role";

revoke trigger on table "public"."zip_codes" from "service_role";

revoke truncate on table "public"."zip_codes" from "service_role";

revoke update on table "public"."zip_codes" from "service_role";

alter table "public"."artists" drop constraint "artists_setlistfm_mbid_key";

alter table "public"."artists" drop constraint "artists_slug_key";

alter table "public"."artists" drop constraint "artists_spotifyId_ticketmasterId_key";

alter table "public"."artists" drop constraint "artists_spotify_id_key";

alter table "public"."homepage_cache" drop constraint "homepage_cache_cache_key_key";

alter table "public"."played_setlist_songs" drop constraint "played_setlist_songs_played_setlist_id_fkey";

alter table "public"."played_setlist_songs" drop constraint "played_setlist_songs_played_setlist_id_position_key";

alter table "public"."played_setlist_songs" drop constraint "played_setlist_songs_played_setlist_id_song_id_key";

alter table "public"."played_setlist_songs" drop constraint "played_setlist_songs_song_id_fkey";

alter table "public"."played_setlists" drop constraint "played_setlists_setlistfm_id_key";

alter table "public"."played_setlists" drop constraint "played_setlists_show_id_fkey";

alter table "public"."search_analytics" drop constraint "search_analytics_user_id_fkey";

alter table "public"."setlist_songs" drop constraint "setlist_songs_setlist_id_fkey";

alter table "public"."setlist_songs" drop constraint "setlist_songs_setlist_id_position_key";

alter table "public"."setlist_songs" drop constraint "setlist_songs_setlist_id_song_id_key";

alter table "public"."setlist_songs" drop constraint "setlist_songs_song_id_fkey";

alter table "public"."setlists" drop constraint "setlists_show_id_fkey";

alter table "public"."setlists" drop constraint "setlists_show_id_order_index_key";

alter table "public"."shows" drop constraint "shows_artist_id_fkey";

alter table "public"."shows" drop constraint "shows_artist_id_venue_id_date_key";

alter table "public"."shows" drop constraint "shows_setlistfm_id_key";

alter table "public"."shows" drop constraint "shows_ticketmaster_id_key";

alter table "public"."shows" drop constraint "shows_venue_id_fkey";

alter table "public"."songs" drop constraint "songs_artist_id_fkey";

alter table "public"."songs" drop constraint "songs_artist_id_title_album_key";

alter table "public"."songs" drop constraint "songs_musicbrainz_id_key";

alter table "public"."songs" drop constraint "songs_spotify_id_key";

alter table "public"."sync_state" drop constraint "sync_state_job_name_key";

alter table "public"."user_artists" drop constraint "user_artists_artist_id_fkey";

alter table "public"."user_artists" drop constraint "user_artists_user_id_artist_id_key";

alter table "public"."user_artists" drop constraint "user_artists_user_id_fkey";

alter table "public"."users" drop constraint "users_spotify_id_key";

alter table "public"."venues" drop constraint "venues_setlistfm_id_key";

alter table "public"."venues" drop constraint "venues_ticketmaster_id_key";

alter table "public"."vote_analytics" drop constraint "unique_user_show_analytics";

alter table "public"."vote_analytics" drop constraint "vote_analytics_show_id_fkey";

alter table "public"."vote_analytics" drop constraint "vote_analytics_user_id_fkey";

alter table "public"."votes" drop constraint "unique_user_song_vote";

alter table "public"."votes" drop constraint "votes_setlist_song_id_fkey";

alter table "public"."votes" drop constraint "votes_show_id_fkey";

alter table "public"."votes" drop constraint "votes_user_id_fkey";

drop index if exists "public"."idx_trending_shows_score";

drop function if exists "public"."create_initial_setlist_for_show"(p_show_id uuid);

drop function if exists "public"."create_or_get_show"(p_ticketmaster_id text, p_artist_name text, p_venue_name text, p_show_date timestamp with time zone, p_venue_city text, p_venue_state text);

drop type "public"."geometry_dump";

drop function if exists "public"."get_homepage_content"();

drop function if exists "public"."get_nearby_shows"(p_zip_code text, p_radius_km integer);

drop function if exists "public"."get_trending_shows_limited"(limit_count integer);

drop function if exists "public"."increment_vote_count"(setlist_song_id uuid);

drop function if exists "public"."refresh_homepage_cache"();

drop function if exists "public"."refresh_trending_shows"();

drop view if exists "public"."trending_shows";

drop materialized view if exists "public"."trending_shows_view";

drop function if exists "public"."update_venue_location"(venue_id uuid, lat double precision, lng double precision);

drop type "public"."valid_detail";

drop function if exists "public"."calculate_trending_score"(total_votes integer, unique_voters integer, days_until_show integer, view_count integer);

alter table "public"."artists" drop constraint "artists_pkey";

alter table "public"."homepage_cache" drop constraint "homepage_cache_pkey";

alter table "public"."played_setlist_songs" drop constraint "played_setlist_songs_pkey";

alter table "public"."played_setlists" drop constraint "played_setlists_pkey";

alter table "public"."search_analytics" drop constraint "search_analytics_pkey";

alter table "public"."setlist_songs" drop constraint "setlist_songs_pkey";

alter table "public"."setlists" drop constraint "setlists_pkey";

alter table "public"."shows" drop constraint "shows_pkey";

alter table "public"."songs" drop constraint "songs_pkey";

alter table "public"."sync_history" drop constraint "sync_history_pkey";

alter table "public"."sync_state" drop constraint "sync_state_pkey";

alter table "public"."user_artists" drop constraint "user_artists_pkey";

alter table "public"."users" drop constraint "users_pkey";

alter table "public"."venues" drop constraint "venues_pkey";

alter table "public"."vote_analytics" drop constraint "vote_analytics_pkey";

alter table "public"."votes" drop constraint "votes_pkey";

alter table "public"."zip_codes" drop constraint "zip_codes_pkey";

drop index if exists "public"."artists_pkey";

drop index if exists "public"."artists_setlistfm_mbid_key";

drop index if exists "public"."artists_slug_key";

drop index if exists "public"."artists_spotifyId_ticketmasterId_key";

drop index if exists "public"."artists_spotify_id_key";

drop index if exists "public"."homepage_cache_cache_key_key";

drop index if exists "public"."homepage_cache_pkey";

drop index if exists "public"."idx_artists_name_trgm";

drop index if exists "public"."idx_artists_setlistfm_mbid";

drop index if exists "public"."idx_homepage_cache_expires";

drop index if exists "public"."idx_homepage_cache_key";

drop index if exists "public"."idx_search_analytics_created";

drop index if exists "public"."idx_search_analytics_query";

drop index if exists "public"."idx_search_analytics_user";

drop index if exists "public"."idx_shows_start_time";

drop index if exists "public"."idx_shows_title";

drop index if exists "public"."idx_venues_location";

drop index if exists "public"."idx_zip_codes_city_state";

drop index if exists "public"."idx_zip_codes_state";

drop index if exists "public"."played_setlist_songs_pkey";

drop index if exists "public"."played_setlist_songs_played_setlist_id_position_key";

drop index if exists "public"."played_setlist_songs_played_setlist_id_song_id_key";

drop index if exists "public"."played_setlists_pkey";

drop index if exists "public"."played_setlists_setlistfm_id_key";

drop index if exists "public"."search_analytics_pkey";

drop index if exists "public"."setlist_songs_pkey";

drop index if exists "public"."setlist_songs_setlist_id_position_key";

drop index if exists "public"."setlist_songs_setlist_id_song_id_key";

drop index if exists "public"."setlist_songs_vote_count_idx";

drop index if exists "public"."setlists_pkey";

drop index if exists "public"."setlists_show_id_order_index_key";

drop index if exists "public"."shows_artist_id_date_idx";

drop index if exists "public"."shows_artist_id_venue_id_date_key";

drop index if exists "public"."shows_date_status_idx";

drop index if exists "public"."shows_pkey";

drop index if exists "public"."shows_setlistfm_id_key";

drop index if exists "public"."shows_ticketmaster_id_key";

drop index if exists "public"."songs_artist_id_title_album_key";

drop index if exists "public"."songs_artist_id_title_idx";

drop index if exists "public"."songs_musicbrainz_id_key";

drop index if exists "public"."songs_pkey";

drop index if exists "public"."songs_spotify_id_key";

drop index if exists "public"."sync_history_pkey";

drop index if exists "public"."sync_state_job_name_key";

drop index if exists "public"."sync_state_pkey";

drop index if exists "public"."unique_user_show_analytics";

drop index if exists "public"."unique_user_song_vote";

drop index if exists "public"."user_artists_pkey";

drop index if exists "public"."user_artists_user_id_artist_id_key";

drop index if exists "public"."users_pkey";

drop index if exists "public"."users_spotify_id_key";

drop index if exists "public"."venues_pkey";

drop index if exists "public"."venues_setlistfm_id_key";

drop index if exists "public"."venues_ticketmaster_id_key";

drop index if exists "public"."vote_analytics_pkey";

drop index if exists "public"."votes_pkey";

drop index if exists "public"."votes_show_id_idx";

drop index if exists "public"."votes_user_id_created_at_idx";

drop index if exists "public"."votes_user_id_show_id_idx";

drop index if exists "public"."zip_codes_pkey";

drop table "public"."artists";

drop table "public"."homepage_cache";

drop table "public"."played_setlist_songs";

drop table "public"."played_setlists";

drop table "public"."search_analytics";

drop table "public"."setlist_songs";

drop table "public"."setlists";

drop table "public"."shows";

drop table "public"."songs";

drop table "public"."sync_history";

drop table "public"."sync_state";

drop table "public"."user_artists";

drop table "public"."users";

drop table "public"."venues";

drop table "public"."vote_analytics";

drop table "public"."votes";

drop table "public"."zip_codes";

drop extension if exists "pg_trgm";

drop extension if exists "postgis";



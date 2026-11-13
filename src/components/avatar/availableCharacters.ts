import { hasArt } from '@/components/comic';
import { CHARACTER_IDS, characterArtId } from '@/content/characters';

/** Personagens com arte pronta nos dois lados (só aparecem os que a May já gerou). */
export function availableCharacters(): string[] {
  return CHARACTER_IDS.filter(
    (id) => hasArt(characterArtId(id, 'red')) && hasArt(characterArtId(id, 'blue')),
  );
}

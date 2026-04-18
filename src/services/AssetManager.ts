/**
 * AssetManager.ts
 * Service pour mapper les tags de l'IA vers les fichiers images locaux
 */

type AssetCategory = 'backgrounds' | 'heroes' | 'items' | 'effects';
type AssetSource = number | null;

const REAL_ASSET_MAP: Record<AssetCategory, Record<string, number>> = {
  backgrounds: {
    bg_chateau: require('../assets/images/backgrounds/bg_chateau.webp'),
    bg_espace: require('../assets/images/backgrounds/bg_espace.webp'),
    bg_foret: require('../assets/images/backgrounds/bg_foret.webp'),
    bg_grotte: require('../assets/images/backgrounds/bg_grotte.webp'),
    bg_ocean_1: require('../assets/images/backgrounds/bg_ocean_1.webp'),
    bg_couloir_vaisseau: require('../assets/images/backgrounds/bg_couloir vaiseau.png'),
    bg_vaisseau_cockpit: require('../assets/images/backgrounds/bg_vaiseau post de pilotage.png'),
  },
  heroes: {
    hero_leo_joie: require('../assets/images/heroes/leo astronaute/hero_léo_joie.png'),
    hero_leo_neutre: require('../assets/images/heroes/leo astronaute/hero_léo_neutre.png'),
    hero_leo_peur: require('../assets/images/heroes/leo astronaute/hero_léo_peur.png'),
    hero_leo_run: require('../assets/images/heroes/leo astronaute/hero_léo_run.png'),
    hero_leo_direction: require('../assets/images/heroes/leo astronaute/hero_léo_montre une direction.png'),
    hero_leo_boussole: require('../assets/images/heroes/leo astronaute/hero_léo_tient la boussole.png'),
  },
  items: {
    item_baguette: require('../assets/images/items/item_baguette.png'),
    item_boussole: require('../assets/images/items/item_boussole.png'),
    item_cle: require('../assets/images/items/item_cle.png'),
    item_potion: require('../assets/images/items/item_potion.png'),
    item_vaisseau: require('../assets/images/items/item_vaiseau.png'),
  },
  effects: {
    fx_brume: require('../assets/images/effects/fx_brume.png'),
    fx_bulles: require('../assets/images/effects/fx_bulles.png'),
    fx_etoiles: require('../assets/images/effects/fx_etoiles.png'),
  },
};

const TAG_ALIASES: Record<AssetCategory, Record<string, string>> = {
  backgrounds: {
    forest: 'bg_foret',
    castle: 'bg_chateau',
    space: 'bg_espace',
    ocean: 'bg_ocean_1',
    cave: 'bg_grotte',
    spaceship_corridor: 'bg_couloir_vaisseau',
    spaceship_cockpit: 'bg_vaisseau_cockpit',
    cockpit: 'bg_vaisseau_cockpit',
    corridor: 'bg_couloir_vaisseau',
  },
  heroes: {
    leo_happy: 'hero_leo_joie',
    leo_brave: 'hero_leo_run',
    leo_curious: 'hero_leo_boussole',
    leo_thinking: 'hero_leo_neutre',
    leo_scared: 'hero_leo_peur',
    leo_pointing: 'hero_leo_direction',
  },
  items: {
    wand: 'item_baguette',
    compass: 'item_boussole',
    key: 'item_cle',
    potion: 'item_potion',
    spaceship: 'item_vaisseau',
    rocket: 'item_vaisseau',
  },
  effects: {
    stars: 'fx_etoiles',
    clouds: 'fx_brume',
    magic: 'fx_bulles',
  },
};

class AssetManager {
  private resolveAssetTag(category: AssetCategory, tag: string): string {
    const aliases = TAG_ALIASES[category];
    return aliases[tag] ?? tag;
  }

  private getAsset(category: AssetCategory, tag: string): AssetSource {
    const resolvedTag = this.resolveAssetTag(category, tag);
    return REAL_ASSET_MAP[category][resolvedTag] ?? null;
  }

  getBackground(tag: string): AssetSource {
    return this.getAsset('backgrounds', tag);
  }

  getHero(tag: string): AssetSource {
    return this.getAsset('heroes', tag);
  }

  getItem(tag: string): AssetSource {
    return this.getAsset('items', tag);
  }

  getEffect(tag: string): AssetSource {
    return this.getAsset('effects', tag);
  }

  getAnimation(_tag: string): string {
    return '';
  }

  getSceneAssets(visuals: { bg: string; hero: string; item: string; effect: string }) {
    return {
      background: this.getBackground(visuals.bg),
      hero: this.getHero(visuals.hero),
      item: this.getItem(visuals.item),
      effect: this.getEffect(visuals.effect),
    };
  }

  getCharacterInfo(characterId: string) {
    const leoImage = this.getAssetOrPlaceholder('heroes', 'leo_happy');

    const characterMap = {
      leo: {
        id: 'leo',
        name: 'Léo',
        description: 'Un astronaute courageux qui explore les étoiles',
        image: leoImage,
        theme: 'space',
      },
      maya: {
        id: 'maya',
        name: 'Maya',
        description: 'Une princesse curieuse qui aime la nature',
        image: this.getAssetOrPlaceholder('heroes', 'maya_happy') ?? leoImage,
        theme: 'garden',
      },
      spark: {
        id: 'spark',
        name: 'Étincelle',
        description: 'Un petit dragon amical et espiègle',
        image: this.getAssetOrPlaceholder('heroes', 'spark_happy') ?? leoImage,
        theme: 'mountain',
      },
    };

    return characterMap[characterId as keyof typeof characterMap] || characterMap.leo;
  }

  getAllCharacters() {
    return ['leo', 'maya', 'spark'].map((id) => this.getCharacterInfo(id));
  }

  generateHeroTag(characterId: string, emotion: string = 'happy'): string {
    return `${characterId}_${emotion}`;
  }

  isValidTag(category: string, tag: string): boolean {
    if (!['backgrounds', 'heroes', 'items', 'effects'].includes(category)) {
      return false;
    }

    const typedCategory = category as AssetCategory;
    const resolvedTag = this.resolveAssetTag(typedCategory, tag);
    return Object.prototype.hasOwnProperty.call(REAL_ASSET_MAP[typedCategory], resolvedTag);
  }

  getAssetOrPlaceholder(category: string, tag: string): AssetSource {
    if (category === 'backgrounds') {
      return this.getBackground(tag);
    }

    if (category === 'heroes') {
      return this.getHero(tag);
    }

    if (category === 'items') {
      return this.getItem(tag);
    }

    if (category === 'effects') {
      return this.getEffect(tag);
    }

    return null;
  }

  addAssetMapping(_category: string, _tag: string, _asset: number): void {
    // Réservé pour l'intégration future.
  }
}

export default new AssetManager();

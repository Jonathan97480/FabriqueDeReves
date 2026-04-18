/**
 * AssetManager.ts
 * Service pour mapper les tags de l'IA vers les fichiers images locaux
 */

interface Placeholder {
  color: string;
  tag: string;
  isPlaceholder: boolean;
}

type AssetSource = number | Placeholder;

const REAL_ASSET_MAP = {
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

const TAG_ALIASES = {
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
  private placeholderColors: any;

  private resolveAssetTag(category: 'backgrounds' | 'heroes' | 'items' | 'effects', tag: string): string {
    const aliases = TAG_ALIASES[category] as Record<string, string>;
    return aliases[tag] ?? tag;
  }

  private getPlaceholder(category: string, tag: string): Placeholder {
    const color =
      this.placeholderColors[category]?.[tag] || this.placeholderColors[category]?.default || '#BDC3C7';
    return {
      color,
      tag: tag || 'default',
      isPlaceholder: true,
    };
  }

  private getRealAsset(
    category: 'backgrounds' | 'heroes' | 'items' | 'effects',
    tag: string
  ): number | null {
    const resolvedTag = this.resolveAssetTag(category, tag);
    const categoryMap = REAL_ASSET_MAP[category] as Record<string, number>;
    return categoryMap[resolvedTag] ?? null;
  }

  constructor() {
    // Couleurs pour les placeholders
    this.placeholderColors = {
      backgrounds: {
        forest: '#2E8B57',
        castle: '#8B4513',
        space: '#1a1a2e',
        ocean: '#4682B4',
        mountain: '#708090',
        village: '#DEB887',
        garden: '#98FB98',
        cave: '#2F4F4F',
        default: '#87CEEB',
      },
      heroes: {
        leo_happy: '#FF6B6B',
        leo_brave: '#4ECDC4',
        leo_curious: '#45B7D1',
        leo_thinking: '#96CEB4',
        maya_happy: '#FFEAA7',
        maya_brave: '#DDA0DD',
        maya_curious: '#98D8C8',
        maya_thinking: '#F7DC6F',
        spark_happy: '#FFA07A',
        spark_brave: '#20B2AA',
        spark_curious: '#FF7F50',
        spark_thinking: '#6495ED',
        default: '#95A5A6',
      },
      items: {
        wand: '#9B59B6',
        compass: '#3498DB',
        mirror: '#1ABC9C',
        book: '#F39C12',
        crown: '#F1C40F',
        key: '#E74C3C',
        lamp: '#E67E22',
        flower: '#2ECC71',
        star: '#F1C40F',
        default: '#BDC3C7',
      },
      effects: {
        stars: '#F1C40F',
        rain: '#3498DB',
        snow: '#ECF0F1',
        fireflies: '#F39C12',
        magic: '#9B59B6',
        clouds: '#BDC3C7',
        default: '#95A5A6',
      },
      icons: {
        compass: '#A8E6CF',
        cave: '#FFB366',
        fairy: '#D8B5FF',
        star: '#FF9EC8',
        map: '#98D8C8',
        key: '#F39C12',
      },
    };
  }

  /**
   * Récupère l'image de fond correspondant au tag
   * @param {string} tag - Le tag de l'IA (ex: 'forest', 'castle')
   * @returns {Placeholder} - Un placeholder coloré
   */
  getBackground(tag: string): AssetSource {
    const realAsset = this.getRealAsset('backgrounds', tag);
    return realAsset ?? this.getPlaceholder('backgrounds', tag);
  }

  /**
   * Récupère l'image du héros correspondant au tag
   * @param {string} tag - Le tag combiné (ex: 'leo_happy', 'maya_brave')
   * @returns {Placeholder} - Un placeholder coloré
   */
  getHero(tag: string): AssetSource {
    const realAsset = this.getRealAsset('heroes', tag);
    return realAsset ?? this.getPlaceholder('heroes', tag);
  }

  /**
   * Récupère l'objet magique correspondant au tag
   * @param {string} tag - Le tag de l'objet (ex: 'wand', 'compass')
   * @returns {Placeholder} - Un placeholder coloré
   */
  getItem(tag: string): AssetSource {
    const realAsset = this.getRealAsset('items', tag);
    return realAsset ?? this.getPlaceholder('items', tag);
  }

  /**
   * Récupère l'effet d'ambiance correspondant au tag
   * @param {string} tag - Le tag de l'effet (ex: 'stars', 'rain')
   * @returns {Placeholder} - Un placeholder coloré
   */
  getEffect(tag: string): AssetSource {
    const realAsset = this.getRealAsset('effects', tag);
    return realAsset ?? this.getPlaceholder('effects', tag);
  }

  /**
   * Récupère l'animation Lottie correspondant au tag
   * @param {string} tag - Le tag de l'animation
   * @returns {string} - Le chemin de l'animation
   */
  getAnimation(tag: string): string {
    // Pour l'instant, retourne une chaîne vide
    // Les vraies animations seront implémentées plus tard
    return '';
  }

  /**
   * Récupère l'icône correspondant au tag
   * @param {string} tag - Le tag de l'icône
   * @returns {Placeholder} - Un placeholder coloré
   */
  getIcon(tag: string): Placeholder {
    const color = this.placeholderColors.icons[tag] || this.placeholderColors.icons.star;
    return {
      color,
      tag: tag || 'star',
      isPlaceholder: true,
    };
  }

  /**
   * Récupère tous les assets pour une scène donnée
   * @param {Object} visuals - L'objet visuals de l'IA
   * @returns {Object} - Tous les placeholders nécessaires
   */
  getSceneAssets(visuals: any) {
    return {
      background: this.getBackground(visuals.bg),
      hero: this.getHero(visuals.hero),
      item: this.getItem(visuals.item),
      effect: this.getEffect(visuals.effect),
    };
  }

  /**
   * Récupère les informations sur un personnage
   * @param {string} characterId - L'ID du personnage
   * @returns {Object} - Les informations du personnage
   */
  getCharacterInfo(characterId: string) {
    const characterMap: any = {
      'leo': {
        id: 'leo',
        name: 'Léo',
        description: 'Un astronaute courageux qui explore les étoiles',
        image: this.getAssetOrPlaceholder('heroes', 'leo_happy'),
        theme: 'space',
      },
      'maya': {
        id: 'maya',
        name: 'Maya',
        description: 'Une princesse curieuse qui aime la nature',
        image: this.getAssetOrPlaceholder('heroes', 'maya_happy'),
        theme: 'garden',
      },
      'spark': {
        id: 'spark',
        name: 'Étincelle',
        description: 'Un petit dragon amical et espiègle',
        image: this.getAssetOrPlaceholder('heroes', 'spark_happy'),
        theme: 'mountain',
      },
    };

    return characterMap[characterId] || characterMap['leo'];
  }

  /**
   * Liste tous les personnages disponibles
   * @returns {Array} - Liste des personnages
   */
  getAllCharacters() {
    return ['leo', 'maya', 'spark'].map((id) => this.getCharacterInfo(id));
  }

  /**
   * Génère un tag de héros combiné
   * @param {string} characterId - L'ID du personnage
   * @param {string} emotion - L'émotion (happy, brave, curious, thinking)
   * @returns {string} - Le tag combiné
   */
  generateHeroTag(characterId: string, emotion: string = 'happy'): string {
    return `${characterId}_${emotion}`;
  }

  /**
   * Valide si un tag existe dans une catégorie
   * @param {string} category - La catégorie (backgrounds, heroes, items, effects)
   * @param {string} tag - Le tag à valider
   * @returns {boolean} - True si le tag existe
   */
  isValidTag(category: string, tag: string): boolean {
    return this.placeholderColors[category]?.hasOwnProperty(tag) || false;
  }

  /**
   * Récupère un asset ou un placeholder
   * @param {string} category - La catégorie
   * @param {string} tag - Le tag
   * @returns {Placeholder} - Un placeholder coloré
   */
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

    return this.getPlaceholder(category, tag);
  }

  /**
   * Ajoute dynamiquement un nouveau mapping (pour utilisation future avec vrais assets)
   * @param {string} category - La catégorie
   * @param {string} tag - Le tag
   * @param {number} asset - L'asset React Native
   */
  addAssetMapping(category: string, tag: string, asset: number): void {
    // Réservé pour l'intégration future de vrais assets
    console.log(`Asset mapping added: ${category}/${tag}`);
  }
}

// Export d'une instance singleton
export default new AssetManager();
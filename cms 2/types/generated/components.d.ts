import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsAbout extends Struct.ComponentSchema {
  collectionName: 'components_sections_about';
  info: {
    description: 'About us section with story';
    displayName: 'About Section';
    icon: 'info-circle';
  };
  attributes: {
    image_position: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
    layout: Schema.Attribute.Enumeration<
      ['two-column', 'centered', 'fullwidth']
    > &
      Schema.Attribute.DefaultTo<'two-column'>;
  };
}

export interface SectionsContatti extends Struct.ComponentSchema {
  collectionName: 'components_sections_contatti';
  info: {
    description: 'Contact section with map and form';
    displayName: 'Contatti Section';
    icon: 'phone';
  };
  attributes: {
    form_fields: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<['nome', 'email', 'telefono', 'messaggio']>;
    map_zoom: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 20;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<15>;
    show_form: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    show_map: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SectionsGallery extends Struct.ComponentSchema {
  collectionName: 'components_sections_gallery';
  info: {
    description: 'Image gallery section';
    displayName: 'Gallery Section';
    icon: 'images';
  };
  attributes: {
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    gap: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<16>;
    image_ratio: Schema.Attribute.Enumeration<['1:1', '16:9', '4:3', 'auto']> &
      Schema.Attribute.DefaultTo<'1:1'>;
    layout: Schema.Attribute.Enumeration<
      ['grid', 'masonry', 'carousel', 'lightbox']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'grid'>;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_hero';
  info: {
    description: 'Hero section with image/video background';
    displayName: 'Hero Section';
    icon: 'image';
  };
  attributes: {
    height: Schema.Attribute.Enumeration<['100vh', '80vh', '60vh', 'auto']> &
      Schema.Attribute.DefaultTo<'100vh'>;
    layout: Schema.Attribute.Enumeration<['fullscreen', 'half', 'minimal']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'fullscreen'>;
    overlay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    overlay_opacity: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 1;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0.5>;
    text_align: Schema.Attribute.Enumeration<['left', 'center', 'right']> &
      Schema.Attribute.DefaultTo<'center'>;
    text_color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#ffffff'>;
  };
}

export interface SectionsMenu extends Struct.ComponentSchema {
  collectionName: 'components_sections_menu';
  info: {
    description: 'Menu or product catalog section';
    displayName: 'Menu/Catalogo Section';
    icon: 'restaurant';
  };
  attributes: {
    categories_enabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    layout: Schema.Attribute.Enumeration<['grid', 'list', 'tabs']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'grid'>;
    show_images: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    show_prices: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SectionsProdotti extends Struct.ComponentSchema {
  collectionName: 'components_sections_prodotti';
  info: {
    description: 'Products showcase section';
    displayName: 'Prodotti Section';
    icon: 'shopping-bag';
  };
  attributes: {
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<4>;
    layout: Schema.Attribute.Enumeration<['grid', 'list', 'masonry']> &
      Schema.Attribute.DefaultTo<'grid'>;
    show_badges: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    show_filters: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SectionsRecensioni extends Struct.ComponentSchema {
  collectionName: 'components_sections_recensioni';
  info: {
    description: 'Testimonials/reviews section';
    displayName: 'Recensioni Section';
    icon: 'star';
  };
  attributes: {
    layout: Schema.Attribute.Enumeration<['grid', 'carousel', 'masonry']> &
      Schema.Attribute.DefaultTo<'carousel'>;
    show_avatar: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    show_rating: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SectionsServizi extends Struct.ComponentSchema {
  collectionName: 'components_sections_servizi';
  info: {
    description: 'Services section with cards';
    displayName: 'Servizi Section';
    icon: 'briefcase';
  };
  attributes: {
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    layout: Schema.Attribute.Enumeration<['grid', 'list', 'cards']> &
      Schema.Attribute.DefaultTo<'grid'>;
    show_icons: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SectionsTeam extends Struct.ComponentSchema {
  collectionName: 'components_sections_team';
  info: {
    description: 'Team members section';
    displayName: 'Team Section';
    icon: 'users';
  };
  attributes: {
    columns: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    layout: Schema.Attribute.Enumeration<['grid', 'carousel']> &
      Schema.Attribute.DefaultTo<'grid'>;
    show_social: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'sections.about': SectionsAbout;
      'sections.contatti': SectionsContatti;
      'sections.gallery': SectionsGallery;
      'sections.hero': SectionsHero;
      'sections.menu': SectionsMenu;
      'sections.prodotti': SectionsProdotti;
      'sections.recensioni': SectionsRecensioni;
      'sections.servizi': SectionsServizi;
      'sections.team': SectionsTeam;
    }
  }
}

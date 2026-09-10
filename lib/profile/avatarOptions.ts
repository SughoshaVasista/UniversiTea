export type AvatarCategory = 'Originals' | 'Western Comics' | 'Manga' | 'Manhwa' | 'Western Bands' | 'Japanese Acts' | 'Korean Acts'

export interface AvatarOption {
  name: string
  emoji: string
  category: AvatarCategory
}

const option = (category: AvatarCategory, entries: Array<[string, string]>): AvatarOption[] =>
  entries.map(([name, emoji]) => ({ name, emoji, category }))

export const avatarOptions: AvatarOption[] = [
  ...option('Originals', [
    ['Panda', '🐼'], ['Fox', '🦊'], ['Owl', '🦉'], ['Tiger', '🐯'], ['Octopus', '🐙'], ['Robot', '🤖'], ['Moon', '🌙'], ['Lightning', '⚡'],
    ['Ninja', '🥷'], ['Dragon', '🐉'], ['Unicorn', '🦄'], ['Snake', '🐍'], ['Cat', '🐈'], ['Bat', '🦇'], ['Wolf', '🐺'], ['Frog', '🐸'],
    ['Wizard', '🧙'], ['Vampire', '🧛'], ['Superhero', '🦸'], ['Alien', '👽'], ['Ghost', '👻'], ['Cowboy', '🤠'], ['Detective', '🕵️'],
    ['Cinema', '🎬'], ['Television', '📺'], ['Guitar', '🎸'], ['Microphone', '🎤'], ['Headphones', '🎧'], ['Arcade', '🎮'], ['Star', '🌟'],
    ['Fire', '🔥'], ['Sword', '⚔️'], ['Ocean', '🌊'], ['Rose', '🌹'], ['Comet', '☄️'], ['Rocket', '🚀'], ['Planet', '🪐'], ['Butterfly', '🦋'],
  ]),
  ...option('Western Comics', [
    ['Wonder Woman', '👑'], ['Hulk', '🟢'], ['Hawkeye', '🎯'], ['Black Widow', '🕷️'], ['Silver Surfer', '🏄'], ['Galactus', '🪐'],
    ['Thanos', '🧤'], ['Moon Knight', '🌙'], ['Black Panther', '🐆'], ['Blade', '🧛'], ['Doctor Doom', '🏰'], ['Lex Luthor', '🧪'],
    ['Reverse-Flash', '⚡'], ['Red Hood', '🔴'], ['Martian Manhunter', '👽'], ['Shazam', '🌩️'], ['Cyborg', '🤖'], ['Nightcrawler', '💨'],
    ['Star-Lord', '🚀'], ['Gambit', '🃏'], ['Cyclops', '🕶️'], ['Jean Grey', '🐦'], ['Swamp Thing', '🌿'], ['Deathstroke', '⚔️'], ['Lobo', '🏍️'],
  ]),
  ...option('Manga', [
    ['Kakashi Hatake', '📖'], ['Sasuke Uchiha', '👁️'], ['Vegeta', '👑'], ['Piccolo', '🧘'], ['Portgas D. Ace', '🔥'], ['Trafalgar Law', '🩺'],
    ['Shanks', '🍶'], ['Sosuke Aizen', '🪞'], ['Kenpachi Zaraki', '🩸'], ['Roy Mustang', '🧤'], ['Erwin Smith', '🐎'], ['Mikasa Ackerman', '🧣'],
    ['Kurapika', '⛓️'], ['Hisoka Morow', '🃏'], ['Megumi Fushiguro', '🐺'], ['Ryomen Sukuna', '👹'], ['Makima', '🐕'], ['Power', '🩸'],
    ['Dio Brando', '⏳'], ['Yoshikage Kira', '💣'], ['Yusuke Urameshi', '👻'], ['Hiei', '🗡️'], ['Conan Edogawa', '🔍'], ['Spike Spiegel', '🚬'], ['Kenshiro', '💥'],
  ]),
  ...option('Manhwa', [
    ['Cha Hae-in', '🤺'], ['Thomas Andre', '🦁'], ['Igris', '♟️'], ['Beru', '🐜'], ['Khun Aguero Agnes', '🧊'], ['Rak Wrathraiser', '🐊'],
    ['Urek Mazino', '💥'], ['Yoo Joonghyuk', '🗡️'], ['Han Sooyoung', '✍️'], ['Uriel', '👼'], ['Seong Yo-han', '🥊'], ['Goo Kim', '🗡️'],
    ['Tom Lee', '🖐️'], ['Hobin Yu', '📹'], ['Baek Yoon-ho', '🐯'], ['Yeon-woo', '🪓'], ['Desir Arman', '🧙'], ['Lucas Traumen', '🪄'],
    ['Roman Dimitri', '👑'], ['Jin Runcandel', '⚔️'], ['Javier Asrahan', '🛡️'], ['Suho', '🐺'], ['Ian Page', '⏳'], ['Jin Tae-kyung', '🎮'], ['Gu Jin-geol', '🥋'],
  ]),
  ...option('Western Bands', [
    ['The Beatles', '🍏'], ['Led Zeppelin', '🔨'], ['Pink Floyd', '🌈'], ['Queen', '👑'], ['Radiohead', '📻'], ['Nirvana', '🎸'],
    ['The Rolling Stones', '👅'], ['Fleetwood Mac', '🕊️'], ['The Clash', '💥'], ['Black Sabbath', '🦇'], ['Metallica', '⚡'], ['AC/DC', '🔌'],
    ['Guns N’ Roses', '🌹'], ['Red Hot Chili Peppers', '🌶️'], ['Green Day', '💣'], ['Linkin Park', '⛓️'], ['Arctic Monkeys', '🐒'], ['Oasis', '🕶️'],
    ['The Cure', '🕷️'], ['Rage Against the Machine', '✊'], ['The Doors', '🚪'], ['The Who', '🎯'], ['Daft Punk', '🤖'], ['Gorillaz', '🦍'], ['Foo Fighters', '✈️'],
  ]),
  ...option('Japanese Acts', [
    ['X Japan', '🙅'], ['L’Arc-en-Ciel', '🌈'], ['Radwimps', '🌠'], ['ONE OK ROCK', '🌍'], ['Babymetal', '🦊'], ['King Gnu', '🐂'],
    ['Official HIGE DANdism', '🧔'], ['Asian Kung-Fu Generation', '👓'], ['The Pillows', '🛋️'], ['Fishmans', '🐟'], ['Yoasobi', '📖'], ['Boris', '🔊'],
    ['Number Girl', '🔪'], ['Maximum the Hormone', '🍜'], ['Man with a Mission', '🐺'], ['Polkadot Stingray', '🐠'], ['Toe', '🥁'], ['BUMP OF CHICKEN', '🐔'],
    ['Spyair', '🦅'], ['KANA-BOON', '🦟'], ['Dir En Grey', '🩸'], ['Mrs. GREEN APPLE', '🍏'], ['Buck-Tick', '🕯️'], ['CHAI', '🌸'], ['Malice Mizer', '🎭'],
  ]),
  ...option('Korean Acts', [
    ['BTS', '💜'], ['Blackpink', '🖤'], ['Stray Kids', '🐺'], ['NewJeans', '🐰'], ['TWICE', '🍭'], ['EXO', '🪐'], ['BIGBANG', '👑'],
    ['SEVENTEEN', '💎'], ['Red Velvet', '🎂'], ['Day6', '🥁'], ['Hyukoh', '👖'], ['Nell', '🌧️'], ['Silica Gel', '🧪'], ['The Rose', '🌹'],
    ['Jannabi', '🐒'], ['CNBLUE', '🎸'], ['FTISLAND', '🚩'], ['Xdinary Heroes', '🎮'], ['Lucy', '🎻'], ['Rolling Quartz', '⚡'], ['Se So Neon', '🐦'],
    ['Dreamcatcher', '🕸️'], ['Epik High', '🗺️'], ['SHINee', '🌟'], ['IU', '🌸'],
  ]),
]

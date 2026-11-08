/*
 * Family Clash — starter games, written for families with middle-school-age kids.
 *
 * Each round: [question, multiplier, [[answer, points], ...]]
 * Points are "out of 100 people surveyed" and listed highest first.
 * To add a starter game, append to STARTERS with a new, stable id — it will be
 * added to every player's library the next time they open the app.
 */
(function () {
  'use strict';
  const FC = window.FC;

  const STARTERS = [
    {
      id: 'starter-school-daze',
      title: 'School Daze',
      rounds: [
        ["Name something you'd find in a kid's backpack", 1, [['Pencils', 30], ['Notebook', 22], ['Homework', 15], ['Lunch', 11], ['Water bottle', 9], ['Calculator', 6], ['Phone', 4]]],
        ['Name a school subject kids complain about', 1, [['Math', 41], ['Science', 18], ['History', 14], ['English', 12], ['Foreign language', 8], ['Gym', 5]]],
        ['Name an excuse for not turning in homework', 1, [['The dog ate it', 35], ['Left it at home', 25], ['Left it in my locker', 13], ['Computer crashed', 11], ["Didn't understand it", 8], ['I was sick', 5]]],
        ['Name something that happens on the last day of school', 2, [['Signing yearbooks', 32], ['Class party', 24], ['Cleaning out lockers', 16], ['Watching a movie', 12], ['Saying goodbye', 8], ['Getting out early', 6]]],
        ['Name a place at school you might hide from a teacher', 3, [['Bathroom', 38], ['Library', 20], ['Under a desk', 14], ['Behind a locker', 10], ['Gym', 8], ['Cafeteria', 6]]],
      ],
    },
    {
      id: 'starter-food-fight',
      title: 'Food Fight',
      rounds: [
        ['Name a pizza topping', 1, [['Pepperoni', 42], ['Extra cheese', 18], ['Sausage', 12], ['Mushrooms', 9], ['Pineapple', 7], ['Olives', 5], ['Peppers', 4]]],
        ['Name a food kids refuse to eat', 1, [['Broccoli', 34], ['Brussels sprouts', 24], ['Spinach', 13], ['Liver', 9], ['Fish', 8], ['Peas', 7]]],
        ['Name something you put on a hot dog', 1, [['Ketchup', 38], ['Mustard', 30], ['Relish', 12], ['Onions', 8], ['Chili', 6], ['Cheese', 4]]],
        ['Name a food that tastes better as leftovers', 2, [['Pizza', 45], ['Lasagna', 15], ['Chili', 12], ['Spaghetti', 10], ['Soup', 8], ['Fried chicken', 6]]],
        ['Name a dessert you might eat at a birthday party', 3, [['Cake', 52], ['Ice cream', 25], ['Cupcakes', 12], ['Cookies', 6], ['Brownies', 3]]],
      ],
    },
    {
      id: 'starter-screen-time',
      title: 'Screen Time',
      rounds: [
        ['Name something people do on their phone besides calling', 1, [['Text', 36], ['Play games', 22], ['Watch videos', 15], ['Social media', 12], ['Take photos', 8], ['Listen to music', 5]]],
        ['Name a reason parents take away a kid’s phone', 1, [['Bad grades', 34], ["It's bedtime", 22], ['At the dinner table', 18], ['Talking back', 12], ['Too much screen time', 9]]],
        ["Name something you'd find in a video game", 1, [['Coins', 26], ['Monsters', 22], ['Power-ups', 16], ['Swords', 12], ['Zombies', 10], ['A boss battle', 8]]],
        ['Name a kind of video people watch online', 2, [['Funny videos', 30], ['Gaming', 22], ['Music videos', 15], ['How-to videos', 13], ['Pranks', 9], ['Animal videos', 7]]],
        ['Name something that makes you yell while playing a video game', 3, [['Losing', 40], ['Lag', 22], ['Controller dies', 13], ['Cheaters', 10], ['Wi-Fi goes out', 9], ['Sibling unplugs it', 5]]],
      ],
    },
    {
      id: 'starter-game-day',
      title: 'Game Day',
      rounds: [
        ['Name a sport played with a ball', 1, [['Soccer', 32], ['Basketball', 28], ['Football', 18], ['Baseball', 12], ['Tennis', 6], ['Volleyball', 3]]],
        ["Name something you'd see at a baseball game", 1, [['Hot dogs', 34], ['Peanuts', 18], ['Players', 14], ['A foul ball', 12], ['The mascot', 10], ['Scoreboard', 6]]],
        ['Name something a coach yells', 1, [['Hustle!', 30], ['Run!', 22], ['Pass the ball!', 16], ['Good job!', 14], ['Defense!', 10], ['Shoot!', 6]]],
        ['Name a piece of sports gear you might find in the garage', 2, [['Bike', 30], ['Basketball', 22], ['Baseball bat', 16], ['Helmet', 12], ['Skateboard', 10], ['Hockey stick', 6]]],
        ['Name an Olympic sport', 3, [['Swimming', 30], ['Gymnastics', 26], ['Track', 20], ['Figure skating', 10], ['Diving', 6], ['Skiing', 5]]],
      ],
    },
    {
      id: 'starter-animal-kingdom',
      title: 'Animal Kingdom',
      rounds: [
        ["Name an animal you'd see at the zoo", 1, [['Lion', 30], ['Elephant', 24], ['Monkey', 18], ['Giraffe', 14], ['Zebra', 7], ['Penguin', 5]]],
        ['Name a popular pet', 1, [['Dog', 46], ['Cat', 32], ['Fish', 9], ['Hamster', 6], ['Bird', 4], ['Rabbit', 2]]],
        ['Name a really slow animal', 1, [['Sloth', 40], ['Turtle', 34], ['Snail', 18], ['Slug', 5]]],
        ["Name an animal you wouldn't want to find in your bed", 2, [['Snake', 42], ['Spider', 28], ['Mouse', 12], ['Cockroach', 8], ['Skunk', 4], ['Bat', 3]]],
        ['Name an animal that lives in the ocean', 3, [['Shark', 34], ['Whale', 26], ['Dolphin', 18], ['Octopus', 10], ['Jellyfish', 6], ['Sea turtle', 4]]],
      ],
    },
    {
      id: 'starter-holiday-hoopla',
      title: 'Holiday Hoopla',
      rounds: [
        ['Name something you might see on a Christmas tree', 1, [['Lights', 36], ['Ornaments', 30], ['Star', 16], ['Tinsel', 8], ['Angel', 5], ['Candy canes', 3]]],
        ['Name a popular Halloween costume', 1, [['Witch', 26], ['Ghost', 22], ['Vampire', 16], ['Superhero', 14], ['Zombie', 10], ['Pirate', 8]]],
        ['Name a food people eat on Thanksgiving', 1, [['Turkey', 48], ['Stuffing', 16], ['Mashed potatoes', 14], ['Pumpkin pie', 10], ['Cranberry sauce', 7], ['Green beans', 3]]],
        ["Name something people do on New Year's Eve", 2, [['Count down to midnight', 32], ['Stay up late', 22], ['Watch the ball drop', 16], ['Have a party', 12], ['Fireworks', 9], ['Make resolutions', 6]]],
        ['Name something that comes in a party goodie bag', 3, [['Candy', 40], ['Stickers', 18], ['Small toys', 14], ['Bubbles', 10], ['Balloons', 8], ['Bouncy ball', 6]]],
      ],
    },
    {
      id: 'starter-summer-break',
      title: 'Summer Break',
      rounds: [
        ['Name something you take to the beach', 1, [['Towel', 32], ['Sunscreen', 24], ['Umbrella', 14], ['Bucket & shovel', 12], ['Cooler', 9], ['Swimsuit', 6]]],
        ['Name a summer activity', 1, [['Swimming', 40], ['Camping', 18], ['Going to the beach', 14], ['Riding bikes', 10], ['Barbecue', 8], ['Fishing', 6]]],
        ['Name an ice cream flavor', 1, [['Chocolate', 36], ['Vanilla', 28], ['Strawberry', 14], ['Cookie dough', 8], ['Mint chocolate chip', 7], ['Cookies & cream', 5]]],
        ["Name something you'd find at an amusement park", 2, [['Roller coaster', 40], ['Cotton candy', 18], ['Ferris wheel', 14], ['Long lines', 10], ['Bumper cars', 8], ['Carnival games', 6]]],
        ['Name something that can ruin a camping trip', 3, [['Rain', 38], ['Bugs', 24], ['Bears', 14], ['Forgetting the tent', 10], ["Fire won't light", 6], ['Getting lost', 5]]],
      ],
    },
    {
      id: 'starter-home-sweet-home',
      title: 'Home Sweet Home',
      rounds: [
        ['Name a chore kids hate doing', 1, [['Dishes', 34], ['Cleaning their room', 26], ['Laundry', 14], ['Taking out the trash', 12], ['Vacuuming', 8], ['Mowing the lawn', 4]]],
        ['Name something that always goes missing at home', 1, [['TV remote', 42], ['Keys', 24], ['Socks', 12], ['Phone', 10], ['Charger', 6], ['Shoes', 4]]],
        ["Name something you'd find under the couch", 1, [['Dust', 26], ['Crumbs', 22], ['Coins', 18], ['Toys', 14], ['Socks', 10], ['The remote', 6]]],
        ['Name something parents always say', 2, [['Because I said so', 36], ['Clean your room', 22], ['Turn off the lights', 14], ['Go ask your dad', 10], ['Were you raised in a barn?', 8], ["I'm not a taxi", 6]]],
        ['Name a reason a kid might get grounded', 3, [['Bad grades', 32], ['Lying', 24], ['Breaking curfew', 14], ['Talking back', 12], ['Fighting with siblings', 10], ['Sneaking out', 5]]],
      ],
    },
    {
      id: 'starter-wild-imagination',
      title: 'Wild Imagination',
      rounds: [
        ["Name a superpower you'd love to have", 1, [['Flying', 40], ['Invisibility', 22], ['Super strength', 12], ['Teleporting', 10], ['Reading minds', 8], ['Time travel', 6]]],
        ['Name something a wizard might carry', 1, [['Wand', 42], ['Pointy hat', 20], ['Spell book', 14], ['Cloak', 10], ['Owl', 6], ['Potion', 5]]],
        ["Name something you'd bring to a deserted island", 1, [['Food', 28], ['Water', 24], ['Knife', 14], ['Phone', 10], ['Matches', 10], ['Tent', 8]]],
        ["Name something you'd do if you were invisible for a day", 2, [['Prank people', 36], ['Sneak into a movie', 18], ['Spy on people', 16], ['Steal snacks', 12], ['Skip school', 8], ['Scare my siblings', 6]]],
        ['Name a dream job', 3, [['Pro athlete', 28], ['YouTuber', 20], ['Astronaut', 16], ['Video game tester', 14], ['Movie star', 10], ['Chef', 6]]],
      ],
    },
    {
      id: 'starter-brain-busters',
      title: 'Brain Busters',
      rounds: [
        ['Name a planet in our solar system', 1, [['Mars', 30], ['Jupiter', 22], ['Earth', 18], ['Saturn', 14], ['Venus', 8], ['Neptune', 5]]],
        ['Name a country famous for its food', 1, [['Italy', 40], ['Mexico', 22], ['France', 14], ['Japan', 10], ['China', 8], ['India', 5]]],
        ['Name something you need for a science experiment', 1, [['Goggles', 30], ['Beakers', 24], ['Baking soda', 14], ['Vinegar', 12], ['Lab coat', 10], ['Gloves', 6]]],
        ['Name a famous landmark', 2, [['Eiffel Tower', 38], ['Statue of Liberty', 24], ['Great Wall of China', 12], ['Pyramids of Giza', 10], ['Big Ben', 8], ['Mount Rushmore', 4]]],
        ['Name something that is really, really hot', 3, [['The sun', 38], ['Fire', 22], ['Lava', 18], ['Oven', 10], ['Stove', 6], ['Hot sauce', 4]]],
      ],
    },
    {
      id: 'starter-movie-night',
      title: 'Movie Night',
      rounds: [
        ['Name a snack people eat at the movies', 1, [['Popcorn', 56], ['Candy', 18], ['Nachos', 10], ['Soda', 8], ['Hot dog', 4], ['Pretzel', 2]]],
        ['Name a kind of movie', 1, [['Comedy', 30], ['Action', 24], ['Horror', 16], ['Animated', 12], ['Romance', 8], ['Sci-fi', 6]]],
        ['Name something that annoys you at the movie theater', 1, [['People talking', 38], ['Phones lighting up', 20], ['Seat kickers', 14], ['Tall person in front', 12], ['Crying babies', 6], ['Sticky floors', 5]]],
        ['Name something a superhero usually has', 2, [['Cape', 34], ['Mask', 26], ['Superpowers', 18], ['Secret identity', 10], ['Sidekick', 6], ['Logo on their chest', 4]]],
        ['Name a reason to leave a movie early', 3, [['Bathroom break', 34], ["It's boring", 28], ['Too scary', 14], ['Feeling sick', 9], ['Phone call', 7], ['Crying kids', 4]]],
      ],
    },
    {
      id: 'starter-snack-attack',
      title: 'Snack Attack',
      rounds: [
        ['Name a crunchy snack', 1, [['Chips', 40], ['Pretzels', 18], ['Popcorn', 14], ['Carrots', 10], ['Crackers', 8], ['Apples', 6]]],
        ['Name a candy you might get trick-or-treating', 1, [['Chocolate bar', 34], ['Lollipops', 18], ['Gummy bears', 14], ['Candy corn', 12], ['Peanut butter cups', 10], ['Licorice', 6]]],
        ['Name something people dip chips into', 1, [['Salsa', 38], ['Guacamole', 20], ['Queso', 16], ['French onion dip', 12], ['Ranch', 8], ['Hummus', 4]]],
        ['Name a fast food menu item', 2, [['Burger', 40], ['French fries', 26], ['Chicken nuggets', 14], ['Pizza', 8], ['Tacos', 6], ['Milkshake', 4]]],
        ["Name a snack you'd sneak from the kitchen at midnight", 3, [['Cookies', 32], ['Ice cream', 26], ['Chips', 16], ['Leftover pizza', 12], ['Candy', 8], ['Cereal', 4]]],
      ],
    },
    {
      id: 'starter-music-mania',
      title: 'Music Mania',
      rounds: [
        ['Name a musical instrument', 1, [['Guitar', 36], ['Piano', 30], ['Drums', 16], ['Violin', 8], ['Trumpet', 5], ['Flute', 3]]],
        ['Name a place people love to sing', 1, [['In the shower', 44], ['In the car', 26], ['Karaoke', 12], ['At a concert', 8], ['Church', 6], ['Birthday party', 2]]],
        ['Name a kind of music', 1, [['Pop', 32], ['Rock', 24], ['Hip-hop', 18], ['Country', 12], ['Classical', 6], ['Jazz', 4]]],
        ["Name something you'd see at a concert", 2, [['Bright lights', 28], ['Huge crowds', 24], ['The band', 18], ['Giant speakers', 12], ['T-shirts for sale', 8], ['Phones in the air', 6]]],
        ['Name a song almost everyone knows the words to', 3, [['Happy Birthday', 52], ['Twinkle Twinkle', 16], ['The national anthem', 12], ['Jingle Bells', 10], ['The ABC song', 6]]],
      ],
    },
    {
      id: 'starter-winter-wonderland',
      title: 'Winter Wonderland',
      rounds: [
        ['Name something you do in the snow', 1, [['Build a snowman', 34], ['Sledding', 26], ['Snowball fight', 18], ['Snow angels', 10], ['Shoveling', 6], ['Skiing', 4]]],
        ["Name something you wear when it's cold", 1, [['Coat', 36], ['Gloves', 22], ['Hat', 18], ['Scarf', 12], ['Boots', 8], ['Earmuffs', 2]]],
        ['Name a warm drink', 1, [['Hot chocolate', 46], ['Coffee', 26], ['Tea', 18], ['Apple cider', 6], ['Warm milk', 2]]],
        ['Name something used to make a snowman', 2, [['Snow', 30], ['Carrot', 26], ['Coal', 16], ['Sticks', 12], ['Buttons', 8], ['Scarf', 6]]],
        ['Name the best thing about a snow day', 3, [['No school', 54], ['Sleeping in', 18], ['Sledding', 12], ['Hot chocolate', 8], ['Video games all day', 6]]],
      ],
    },
    {
      id: 'starter-going-places',
      title: 'Going Places',
      rounds: [
        ['Name something you pack for a vacation', 1, [['Clothes', 36], ['Toothbrush', 20], ['Swimsuit', 14], ['Phone charger', 12], ['Snacks', 8], ['Sunscreen', 6]]],
        ["Name something you'd see at an airport", 1, [['Planes', 34], ['Security line', 20], ['Suitcases', 18], ['Long lines', 12], ['Pilots', 8], ['Gift shop', 4]]],
        ['Name something kids ask on a long car ride', 1, [['Are we there yet?', 58], ['Can we stop?', 14], ["I'm hungry!", 10], ['I need the bathroom', 8], ['Can I use your phone?', 6]]],
        ['Name a way to travel', 2, [['Car', 38], ['Plane', 28], ['Train', 14], ['Bus', 10], ['Boat', 6], ['Bike', 3]]],
        ["Name something you'd buy as a souvenir", 3, [['T-shirt', 36], ['Keychain', 18], ['Magnet', 14], ['Postcard', 12], ['Snow globe', 10], ['Hat', 6]]],
      ],
    },
    {
      id: 'starter-birthday-bash',
      title: 'Birthday Bash',
      rounds: [
        ["Name something you'd see at a birthday party", 1, [['Cake', 38], ['Balloons', 24], ['Presents', 18], ['Candles', 10], ['Party hats', 6], ['Piñata', 2]]],
        ['Name a fun place to have a birthday party', 1, [['Bowling alley', 24], ['Trampoline park', 22], ['Pizza place', 18], ['Pool', 14], ['Laser tag', 10], ['Backyard', 8]]],
        ['Name a party game', 1, [['Musical chairs', 28], ['Pin the tail on the donkey', 24], ['Hide and seek', 16], ['Piñata', 14], ['Freeze dance', 10], ['Duck duck goose', 6]]],
        ['Name something you do right before blowing out the candles', 2, [['Make a wish', 54], ['Sing Happy Birthday', 26], ['Take a picture', 10], ['Take a deep breath', 6]]],
        ['Name a birthday present a middle schooler would love', 3, [['Phone', 30], ['Video game', 24], ['Money', 18], ['Headphones', 12], ['Gift card', 8], ['Clothes', 4]]],
      ],
    },
    {
      id: 'starter-spooky-stuff',
      title: 'Spooky Stuff',
      rounds: [
        ['Name something people are scared of', 1, [['Spiders', 30], ['The dark', 24], ['Heights', 18], ['Clowns', 12], ['Snakes', 10], ['Ghosts', 4]]],
        ['Name a famous monster', 1, [['Vampire', 28], ['Zombie', 24], ['Werewolf', 18], ['Frankenstein', 14], ['Mummy', 8], ['Bigfoot', 4]]],
        ["Name something you'd find in a haunted house", 1, [['Ghosts', 34], ['Cobwebs', 22], ['Creaky doors', 14], ['Skeletons', 12], ['Bats', 8], ['Creepy paintings', 6]]],
        ["Name something you'd hear at a sleepover late at night", 2, [['Ghost stories', 30], ['Giggling', 24], ['Snoring', 14], ['Creepy noises', 12], ['"Go to sleep!"', 10], ['Rain', 4]]],
        ["Name something you do when you're scared", 3, [['Scream', 36], ['Hide', 24], ['Run away', 18], ['Close your eyes', 10], ['Turn on the lights', 6], ['Grab someone', 4]]],
      ],
    },
    {
      id: 'starter-weekend-fun',
      title: 'Weekend Fun',
      rounds: [
        ['Name something you do on a Saturday morning', 1, [['Sleep in', 38], ['Watch cartoons', 20], ['Eat pancakes', 14], ['Sports games', 12], ['Chores', 8], ['Play video games', 6]]],
        ['Name something you need for a sleepover', 1, [['Sleeping bag', 34], ['Pillow', 24], ['Pajamas', 16], ['Snacks', 12], ['Toothbrush', 8], ['A movie', 4]]],
        ['Name something people do at the mall', 1, [['Shop', 44], ['Eat at the food court', 22], ['Hang out with friends', 14], ['Play at the arcade', 8], ['Window shop', 6], ['People watch', 4]]],
        ['Name a board game families play', 2, [['Monopoly', 34], ['Scrabble', 16], ['Clue', 14], ['Sorry!', 12], ['Candy Land', 10], ['Chess', 8]]],
        ['Name something families argue about', 3, [['What to watch on TV', 30], ['Chores', 24], ['Screen time', 16], ['Where to eat', 14], ['Who sits in front', 10], ['Bedtime', 4]]],
      ],
    },
    {
      id: 'starter-once-upon-a-time',
      title: 'Once Upon a Time',
      rounds: [
        ['Name a fairy tale character', 1, [['Cinderella', 30], ['Snow White', 22], ['Little Red Riding Hood', 16], ['Goldilocks', 12], ['Rapunzel', 10], ['The Big Bad Wolf', 6]]],
        ["Name something you'd find in a castle", 1, [['King or queen', 30], ['Throne', 22], ['Moat', 16], ['Knights', 12], ['Dragon', 10], ['Tower', 6]]],
        ['Name a superhero', 1, [['Superman', 34], ['Spider-Man', 28], ['Batman', 22], ['Wonder Woman', 8], ['Iron Man', 6]]],
        ['Name something that happens at the end of a fairy tale', 2, [['Happily ever after', 48], ['A wedding', 20], ['The villain loses', 14], ["True love's kiss", 10], ['The spell is broken', 4]]],
        ['Name a magical creature', 3, [['Unicorn', 34], ['Dragon', 28], ['Fairy', 16], ['Mermaid', 10], ['Phoenix', 6], ['Elf', 4]]],
      ],
    },
    {
      id: 'starter-totally-gross',
      title: 'Totally Gross',
      rounds: [
        ['Name something gross you might find in a school cafeteria', 1, [['Mystery meat', 30], ['Old gum', 22], ['Spilled milk', 16], ['Hair in the food', 14], ['Moldy bread', 8], ['Bugs', 6]]],
        ['Name something that smells really bad', 1, [['Garbage', 30], ['Stinky feet', 24], ['Skunk', 20], ['Rotten eggs', 12], ['Dirty socks', 8], ['The bathroom', 4]]],
        ['Name something kids do that grosses out their parents', 1, [['Pick their nose', 42], ['Burp', 22], ["Don't wash their hands", 14], ['Chew with mouth open', 12], ['Wipe nose on sleeve', 6]]],
        ["Name something you'd hate to step on barefoot", 2, [['A LEGO brick', 40], ['Broken glass', 18], ['Gum', 14], ['Dog poop', 12], ['A bug', 8], ['Thumbtack', 6]]],
        ['Name something slimy', 3, [['Slugs', 28], ['Slime', 24], ['Snails', 18], ['Worms', 12], ['Boogers', 10], ['Frogs', 6]]],
      ],
    },
  ];

  // The original sample game first, then the starter pack.
  FC.starterGames = () =>
    [FC.sampleGame()].concat(
      STARTERS.map((g) =>
        FC.normalizeGame({
          id: g.id,
          title: g.title,
          rounds: g.rounds.map(([question, multiplier, answers]) => ({
            question,
            multiplier,
            answers: answers.map(([text, points]) => ({ text, points })),
          })),
        })
      )
    );
})();

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

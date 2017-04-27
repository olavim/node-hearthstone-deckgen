# Hearthstone Deck Generator

Web application for generating randomized decks from your [hearthpwn.com](http://hearthpwn.com) collection.

Hosted currently at [hearthstone-deckgen.herokuapp.com/](http://hearthstone-deckgen.herokuapp.com/)

## Features

* Generate a random deck from cards you own.
* Draft an arena-style deck from cards you own.

## Instructions

Before you start, you probably want to sync your Hearthstone collection to
[hearthpwn.com](http://hearthpwn.com), since we get your cards from there. Fortunately, hearthpwn 
has a fantastic program named [innkeeper](http://www.innkeeper.com/) that does this for you automatically.

After your collection is synced to hearthpwn, you have two options:  
1. Conveniently load your collection to the app by simply giving your hearthpwn username.
This requires your collection to be public, however. If you don't want to make it public, you can:
2. Save the HTML page of your collection to your computer and upload it to the deck 
generator app. Don't worry, it's not saved anywhere; only the data in it is read so that 
we can generate decks from your cards.

**NOTE:** Loading your collection with your hearthpwn username is not guaranteed to work
indefinitely: hearthpwn might prevent it in the future. If that happens, using your collection's 
HTML page works as a fallback.

#### Making your hearthpwn collection public

1. Navigate to [hearthpwn.com](http://hearthpwn.com).
2. Hover your cursor over your name in the upper right corner, and select **My Collection**.
3. Find the **Edit Collection** button in your collection view, and click it.
4. Switch your collection from *private* to *public*.
5. Click **Save Collection**.

#### Use your collection's HTML page to parse your collection

1. Navigate to [hearthpwn.com](http://hearthpwn.com).
2. Hover your cursor over your name in the upper right corner, and select **My Collection**.
3. Save the page to your computer. How this is done differs between browsers, but simply
right-clicking the webpage and selecting **Save As** or **Save Page As** should work.
4. In the deck generator app, click the file browser and select the `.htm` or `.html`
file you downloaded in the previous step.
5. Click **load file**.

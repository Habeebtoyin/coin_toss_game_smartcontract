import { context, u128, PersistentMap, logging, ContractPromiseBatch, RNG } from "near-sdk-as";

enum GameState {
    Created,
    InProgress,
    Completed,
    NotFound
}

/**
 * Exporting a new class Game so it can be used outside of this file
 */
@nearBindgen
export class Game {
    id: u32
    gameState: GameState
    deposit1: u128
    deposit2: u128
    player1: string
    player2: string
    player1Guess: boolean
    player2Guess: boolean
    winner: string

    constructor() {
        const rng = new RNG<u32>(1, u32.MAX_VALUE)
        this.id = rng.next()
        this.deposit1 = context.attachedDeposit
        this.player1 = context.sender
        this.deposit2 = u128.Zero
        this.gameState = GameState.Created

    }

}

let games = new PersistentMap<u32, Game>('G');

export function createGame() : u32 {
    const game = new Game()
    games.set(game.id, game)
    return game.id
}

export function joinGame(gameId: u32) : boolean {
    
    let checkedGame = games.getSome(gameId)
    if(checkedGame != null) {
        /**
         * Check if the game corresponds to a created game
         * and if the same amount of deposit is attached.
         * Also check if the same player is calling the game or not.
         */

        if(context.attachedDeposit >= checkedGame.deposit1
            && checkedGame.gameState == GameState.Created
            && context.sender != checkedGame.player1
        ) {
            checkedGame.deposit2 = context.attachedDeposit
            checkedGame.gameState = GameState.InProgress
            checkedGame.player2 = context.sender
            games.set(checkedGame.id, checkedGame)
            return true
        } else {
            return false
        }
    } else {
        return false
    }
    
}

export function chooseGuesser(gameId: u32): string {
    const randomNumber = new RNG<u32>(1, u32.MAX_VALUE);
    const randomNum = randomNumber.next();
    const game = games.getSome(gameId);
    if (game != null) {
      //FILL IN THIS SEGMENT WITH CODE TO CHOOSE A GUESSER
      if(randomNum % 2 == 0) {
          return game.player1
      }else{
          return game.player2
      }
    }
    return "Game Not Found";
  }

export function makeAGuess(gameId: u32, guess: boolean): string {
    const game = games.getSome(gameId);
    if (game != null) {
        if (game.gameState == GameState.InProgress) {
        if (context.sender == game.player1) {
            game.player1Guess = guess
        } else {
            game.player2Guess
        }
        games.set(game.id, game);
        return "Done";
        }
    }
    return "Game Not Found";
}

//Get the first player details
export function getPlayer1Details(gameId: i32): string {
    const game = games.getSome(gameId);
    if(game != null){
        return game.player1;
    }
    
    return "None";
}


//Get the second player details
export function getPlayer2Details(gameId: i32): string {
    const game = games.getSome(gameId);
    if(game != null){
        return game.player2;
    }
    
    return "None";
}

//Get the deposit details
export function getDeposit(gameId: i32): u128 {
    const game = games.getSome(gameId);
    if(game != null){
        return game.deposit1;
    }
    
    return u128.Zero;
}

//Get the Game State
export function getGameState(gameId: i32): GameState {
    const game = games.getSome(gameId);
    if(game != null){
        return game.gameState;
    }
    
    return GameState.NotFound;
}

export function finishGame(gameId: u32): string {
    const randomNumber = new RNG<u32>(1, u32.MAX_VALUE);
    const randomNum = randomNumber.next();
    const game = games.getSome(gameId);
    if (game != null && game.gameState == GameState.InProgress) {
      if (randomNum % 3 == 0) {
        if (game.player2Guess == true) {
          game.gameState = GameState.Completed;
          game.winner = game.player2;
          games.set(game.id, game);
          //Send 2*deposit to the winning player
          const to_beneficiary = ContractPromiseBatch.create(game.winner);
          to_beneficiary.transfer(u128.add(game.deposit1, game.deposit2));
          return game.winner;
        } else {
          game.gameState = GameState.Completed;
          game.winner = game.player1;
          games.set(game.id, game);
          //Send 2*deposit to the winning player
          const to_beneficiary = ContractPromiseBatch.create(game.winner);
          to_beneficiary.transfer(u128.add(game.deposit1, game.deposit2));
          return game.winner;
        }
      } else {
        if (game.player2Guess == false) {
          game.gameState = GameState.Completed;
          game.winner = game.player2;
          games.set(game.id, game);
          //Send 2*deposit to the winning player
          const to_beneficiary = ContractPromiseBatch.create(game.winner);
          to_beneficiary.transfer(u128.add(game.deposit1, game.deposit2));
          return game.winner;
        } else {
          game.gameState = GameState.Completed;
          game.winner = game.player1;
          games.set(game.id, game);
          //Send 2*deposit to the winning player
          const to_beneficiary = ContractPromiseBatch.create(game.winner);
          to_beneficiary.transfer(u128.add(game.deposit1, game.deposit2));
          return game.winner;
        }
      }
    }
    return "None";
   }
   
   //Get the winner of the game
   export function getWinner(gameId: i32): string {
        const game = games.getSome(gameId);
          if(games != null){
              if(game.gameState == GameState.Completed){
                  return game.winner;
              }
          }
      return "None";
   }
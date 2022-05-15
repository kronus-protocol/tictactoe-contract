use anchor_lang::prelude::*;

declare_id!("5gk9VvQLwJtAt2KxxccvYeeDkJkMsmUzyt1p8e4qMdBL");

#[program]
pub mod kronus {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_game(ctx: Context<InitializeGame>, _uuid: String) -> Result<()> {

        let game = &mut ctx.accounts.game;

        game.player_one_key = ctx.accounts.player_one.key();
        game.player_one_singing_key = ctx.accounts.player_one_singing_key.key();
        game.player_two_key = ctx.accounts.player_two.key();
        game.last_timestamp = Clock::get().unwrap().unix_timestamp;
        game.game_end_time = Clock::get().unwrap().unix_timestamp + 600;
        game.game_outcome = GameOutcome::None;
        game.game_status = GameStatus::PlayerOneStarted;
        game.game_play_turn = GamePlayTurn::None;
        game.moves = Vec::with_capacity(8);

        // let from_transfer = ctx.accounts.player_one.to_account_info();
        // let to_transfer = ctx.accounts.player_one_singing_key.to_account_info();
        //
        // **from_transfer.try_borrow_mut_lamports()? -= amount;
        // **to_transfer.try_borrow_mut_lamports()? += amount;

        // let ix = anchor_lang::solana_program::system_instruction::transfer(
        //     &ctx.accounts.player_one.key(),
        //     &ctx.accounts.player_one_singing_key.key(),
        //     amount
        // );
        //
        // anchor_lang::solana_program::program::invoke(
        //     &ix,
        //     &[
        //         ctx.accounts.player_one.to_account_info(),
        //         ctx.accounts.player_one_singing_key.to_account_info(),
        //     ]
        // )?;

        Ok(())
    }

    pub fn accept_game(ctx: Context<AcceptGame>, nonce: i64) -> Result<()> {
        let game = &mut ctx.accounts.game;

        if game.player_two_key != ctx.accounts.player_two.key() {
            return Err(ErrorCode::InvalidPlayer.into());
        }

        if game.game_status != GameStatus::PlayerOneStarted {
            return Err(ErrorCode::InvalidAction.into());
        }

        if game.last_timestamp >= nonce {
            return Err(ErrorCode::InvalidNonce.into());
        }

        if game.game_end_time <= nonce {
            return Err(ErrorCode::GameTimeOver.into());
        }

        game.player_two_singing_key = ctx.accounts.player_two_singing_key.key();
        game.game_status = GameStatus::PlayerTwoStarted;
        game.game_play_turn = GamePlayTurn::PlayerOne;
        game.last_timestamp = Clock::get().unwrap().unix_timestamp;

        // let from_transfer = ctx.accounts.player_two.to_account_info();
        // let to_transfer = ctx.accounts.player_two_singing_key.to_account_info();
        //
        // **from_transfer.try_borrow_mut_lamports()? -= amount;
        // **to_transfer.try_borrow_mut_lamports()? += amount;

        Ok(())
    }

    pub fn make_move(ctx: Context<MakeMove>, move_index: u32, nonce: i64) -> Result<()> {

        let game = &mut ctx.accounts.game;

        if game.game_status == GameStatus::GameEnded {
            return Err(ErrorCode::GameEnded.into());
        }

        if game.last_timestamp >= nonce {
            return Err(ErrorCode::InvalidNonce.into());
        }

        if game.game_end_time <= nonce {
            return Err(ErrorCode::GameTimeOver.into());
        }

        if game.game_status == GameStatus::None || game.game_status == GameStatus::PlayerOneStarted {
            return Err(ErrorCode::InvalidAction.into());
        }

        // Check Player
        if game.game_play_turn == GamePlayTurn::PlayerOne &&
            (game.player_one_key != ctx.accounts.player.key() || game.player_one_singing_key != ctx.accounts.player_singer.key()) {
            return Err(ErrorCode::InvalidPlayer.into());
        }

        if game.game_play_turn == GamePlayTurn::PayerTwo &&
            (game.player_two_key != ctx.accounts.player.key() || game.player_two_singing_key != ctx.accounts.player_singer.key()) {
            return Err(ErrorCode::InvalidPlayer.into());
        }

        if move_index > 8 {
            return Err(ErrorCode::InvalidMove.into());
        }

        // check if move exist
        if game.moves.len() > 0 {

            for move_iter in game.moves.as_slice() {
                if move_iter.move_index == move_index {
                    return Err(ErrorCode::MoveAlreadyMake.into());
                }
            }
        }

        let timestamp = Clock::get().unwrap().unix_timestamp;

        // Added Move
        let new_move = Move{
            player_key: ctx.accounts.player.key(),
            move_index,
            timestamp,
            game_play_turn: game.game_play_turn.clone()
        };

        game.moves.push(new_move);

        if game.game_status == GameStatus::PlayerTwoStarted && game.moves.len() == 1 {
            game.game_status = GameStatus::GameInProgress;
        }

        // Check for winner

        // if game.moves.len() >= 5 {
            let winning_moves:[ [u32;3]; 8] = [
                [0,1,2],
                [3,4,5],
                [6,7,8],

                [0,3,6],
                [1,4,7],
                [2,5,8],

                [0,4,8],
                [2,4,6]
            ];

            let mut player_moves: Vec<u32> = vec![];

            for move_iter in game.moves.as_slice() {
                player_moves.push(move_iter.move_index);
            }

            player_moves.sort();

            let mut place_one: bool = false;

            let mut place_two: bool = false;

            let mut place_three: bool = false;

            for win in winning_moves.iter() {

                for winning_place in player_moves.iter() {
                    if winning_place.clone() == win[0] {
                        place_one = true;
                    }
                }

                for winning_place in player_moves.iter() {
                    if winning_place.clone() == win[1] {
                        place_two = true;
                    }
                }

                for winning_place in player_moves.iter() {
                    if winning_place.clone() == win[2] {
                        place_three = true;
                    }
                }

                if place_one && place_two && place_three {
                    break;
                }
            }

            // mark winner

            if place_one && place_two && place_three {
                if game.game_play_turn == GamePlayTurn::PlayerOne {
                    game.game_outcome = GameOutcome::PlayerOneWinner;
                } else {
                    game.game_outcome = GameOutcome::PlayerTwoWinner;
                }

                game.game_status = GameStatus::GameEnded;
            }

        // }

        // Game is Draw
        if game.moves.len() == 8 && game.game_outcome == GameOutcome::None {
            game.game_outcome = GameOutcome::GameDraw;
        } else {

            if game.game_status != GameStatus::GameEnded {
                if game.game_play_turn == GamePlayTurn::PlayerOne {
                    game.game_play_turn = GamePlayTurn::PayerTwo;
                } else {
                    game.game_play_turn = GamePlayTurn::PlayerOne;
                }
            }
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
}

#[derive(Accounts)]
#[instruction(_uuid: String)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub player_one: Signer<'info>,

    /// CHECK: player_one_singing_key
    #[account(mut)]
    pub player_one_singing_key: AccountInfo<'info>,

    /// CHECK: player_two
    pub player_two: AccountInfo<'info>,

    #[account(
    init,
    payer = player_one,
    space = 600,
    seeds = [_uuid.as_ref()],
    bump
    )]
    pub game: Account<'info, Game>,

    pub system_program: Program <'info, System>
}

#[derive(Accounts)]
pub struct AcceptGame<'info> {
    #[account(mut)]
    pub player_two: Signer<'info>,

    /// CHECK: player_two_singing_key
    #[account(mut)]
    pub player_two_singing_key: AccountInfo<'info>,

    #[account(mut)]
    pub game: Account<'info, Game>,

    pub system_program: Program <'info, System>
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(mut)]
    pub player_singer: Signer<'info>,

    /// CHECK: player
    pub player: AccountInfo<'info>,

    #[account(mut)]
    pub game: Account<'info, Game>
}

#[account]
pub struct Game{

    pub player_one_key: Pubkey,

    pub player_two_key: Pubkey,

    pub player_one_singing_key: Pubkey,

    pub player_two_singing_key: Pubkey,

    pub last_timestamp: i64,

    pub moves: Vec<Move>,

    pub game_status: GameStatus,

    pub game_outcome: GameOutcome,

    pub game_play_turn: GamePlayTurn,

    pub game_end_time: i64
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Move {
    pub player_key: Pubkey,

    pub move_index: u32,

    pub game_play_turn: GamePlayTurn,

    pub timestamp: i64
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum GameStatus {
    None,
    PlayerOneStarted,
    PlayerTwoStarted,
    GameInProgress,
    GameEnded

}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum GameOutcome {
    None,
    PlayerOneWinner,
    PlayerTwoWinner,
    GameDraw
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum GamePlayTurn {
    None,
    PlayerOne,
    PayerTwo
}


#[error_code]
pub enum ErrorCode {
    #[msg("Invalid action")]
    InvalidAction,

    #[msg("Invalid player")]
    InvalidPlayer,

    #[msg("Invalid player singer")]
    InvalidPlayerSinger,

    #[msg("Game ended")]
    GameEnded,

    #[msg("Game time over")]
    GameTimeOver,

    #[msg("Invalid nonce")]
    InvalidNonce,

    #[msg("Invalid move")]
    InvalidMove,

    #[msg("Move already make")]
    MoveAlreadyMake,
}

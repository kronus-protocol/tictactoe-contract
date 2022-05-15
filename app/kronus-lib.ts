import {Program, BN, Wallet, AnchorProvider} from '@project-serum/anchor';
import { Connection, Transaction, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { IDL, Kronus } from '../target/types/kronus';
import * as anchor from "@project-serum/anchor";

export class KronusLib {
    program: Program<Kronus>;
    connection: Connection;

    constructor(programId: PublicKey, connection: Connection, wallet: Wallet) {
        this.connection = connection;
        const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
        this.program = new Program(IDL, programId, provider);
    }

    async getGamePdaAddress(uuid: String): Promise<PublicKey> {
        const [gamePdaAddress] = await PublicKey.findProgramAddress([Buffer.from(uuid)], this.program.programId);

        return gamePdaAddress;
    }

    async isGamePdaInitialize(gamePdaAddress: PublicKey): Promise<boolean> {
        const levelUpAccountInfo = await this.connection.getAccountInfo(gamePdaAddress);

        return levelUpAccountInfo != null;
    }

    async initializeGame (uuid: string, playerOne: PublicKey, playerOneSinger: PublicKey, playerTwo: PublicKey) : Promise<Transaction> {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (isGamePdaInitialized) {
            throw Error('Game already initialize');
        }

        const initializeGameTx = this.program.methods.initializeGame(uuid)
            .accounts({
                playerOne: playerOne,
                playerOneSingingKey: playerOneSinger,
                playerTwo: playerTwo,
                game: gamePdaAddress,
                systemProgram: anchor.web3.SystemProgram.programId
            }).transaction();

        return initializeGameTx;
    }

    async acceptGame (uuid: string, playerTwo: PublicKey, playerTwoSinger: PublicKey) : Promise<Transaction> {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const acceptGameTx = await this.program.methods.acceptGame(new anchor.BN(currentBlockTime))
            .accounts({
                playerTwo: playerTwo,
                playerTwoSingingKey: playerTwoSinger,
                game: gamePdaAddress,
                systemProgram: anchor.web3.SystemProgram.programId
            }).transaction();

        return acceptGameTx;
    }

    async makeMove(uuid: string, player: PublicKey, playerSinger: PublicKey, moveValue: number) : Promise<Transaction> {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const makeMoveTx = await this.program.methods.makeMove(moveValue, new anchor.BN(currentBlockTime))
            .accounts({
                player: player,
                playerSinger: playerSinger,
                game: gamePdaAddress
            }).transaction();

        return makeMoveTx;
    }

    async getGameDataByUuid(uuid: String): Promise<any> {
        const gamePdaAddress = await this.getGamePdaAddress(uuid);

        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        return (await this.program.account.game.fetch(gamePdaAddress));
    }

    async getGameDataByPda(gamePdaAddress: PublicKey): Promise<any> {
        const isGamePdaInitialized = await this.isGamePdaInitialize(gamePdaAddress);

        if (!isGamePdaInitialized) {
            throw Error('Game is not initialize');
        }

        return (await this.program.account.game.fetch(gamePdaAddress));
    }

}
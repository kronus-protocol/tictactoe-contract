import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Kronus } from "../target/types/kronus";
import * as nacl from 'tweetnacl';
import common from "mocha/lib/interfaces/common";

describe("kronus", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Kronus as Program<Kronus>;

  const playerOneKeypair = anchor.web3.Keypair.generate();
  const playerOneSigningKeypair = anchor.web3.Keypair.generate();
  const playerTwoKeypair = anchor.web3.Keypair.generate();
  const playerTwoSigningKeypair = anchor.web3.Keypair.generate();

  const gameId = "new-game";

  const [gamePda, gameBump] =
      await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(gameId)],
          program.programId
      );

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  const timeDelayed = 2000;

  it("Ready Player!", async () => {
    const playerOneFundAirDropHash = await anchor.AnchorProvider.env().connection.requestAirdrop(playerOneKeypair.publicKey, 10000000000);
    console.log("Player One Fund Airdrop hash: ", playerOneFundAirDropHash);
    await delay(timeDelayed);
      console.log((await anchor.AnchorProvider.env().connection.getBalance(playerOneKeypair.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);

    const playerTwoFundAirDropHash = await anchor.AnchorProvider.env().connection.requestAirdrop(playerTwoKeypair.publicKey, 10000000000);
    console.log("Player Two Fund Airdrop hash: ", playerTwoFundAirDropHash);
    await delay(timeDelayed);

    console.log((await anchor.AnchorProvider.env().connection.getBalance(playerTwoKeypair.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);

      const playerOneSingerFundAirDropHash = await anchor.AnchorProvider.env().connection.requestAirdrop(playerOneSigningKeypair.publicKey, 1000000000);
      console.log("Player one Singer Fund Airdrop hash: ", playerOneSingerFundAirDropHash);
      await delay(timeDelayed);

      console.log((await anchor.AnchorProvider.env().connection.getBalance(playerOneSigningKeypair.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);

      const playerTwoSingerFundAirDropHash = await anchor.AnchorProvider.env().connection.requestAirdrop(playerTwoSigningKeypair.publicKey, 1000000000);
      console.log("Player Two Singer Fund Airdrop hash: ", playerTwoSingerFundAirDropHash);
      await delay(timeDelayed);

      console.log((await anchor.AnchorProvider.env().connection.getBalance(playerTwoSigningKeypair.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);


  });

  it("initializeGame", async () => {
    const tx = await program.methods.initializeGame(gameId)
        .accounts({
          playerOne: playerOneKeypair.publicKey,
          playerOneSingingKey: playerOneSigningKeypair.publicKey,
          playerTwo: playerTwoKeypair.publicKey,
          game: gamePda,
          systemProgram: anchor.web3.SystemProgram.programId
        }).transaction();

      tx.feePayer = playerOneKeypair.publicKey;
      tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

      const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerOneKeypair.secretKey);

      tx.addSignature(playerOneKeypair.publicKey, Buffer.from(bobSignature));

    const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
    console.log("Your transaction signature", txHash);
    await delay(timeDelayed);
    console.log((await program.account.game.fetch(gamePda)));
  });

  it("acceptGame", async () => {
    const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

    const tx = await program.methods.acceptGame(new anchor.BN(currentBlockTime))
        .accounts({
          playerTwo: playerTwoKeypair.publicKey,
          playerTwoSingingKey: playerTwoSigningKeypair.publicKey,
          game: gamePda,
          systemProgram: anchor.web3.SystemProgram.programId
        }).transaction();

    tx.feePayer = playerTwoKeypair.publicKey;
    tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

    const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerTwoKeypair.secretKey);

    tx.addSignature(playerTwoKeypair.publicKey, Buffer.from(bobSignature));

    const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
    console.log("Your transaction signature", txHash);
    await delay(timeDelayed);
    console.log((await program.account.game.fetch(gamePda)));
  });

  it("Player One make move 0", async () => {
    const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

    const tx = await program.methods.makeMove(0, new anchor.BN(currentBlockTime))
        .accounts({
          player: playerOneKeypair.publicKey,
          playerSinger: playerOneSigningKeypair.publicKey,
          game: gamePda
        }).transaction();

    tx.feePayer = playerOneSigningKeypair.publicKey;
    tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

    const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerOneSigningKeypair.secretKey);

    tx.addSignature(playerOneSigningKeypair.publicKey, Buffer.from(bobSignature));

    const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
    console.log("Your transaction signature", txHash);
    await delay(timeDelayed);
    console.log((await program.account.game.fetch(gamePda)));
  });

  it("Player two make move 1", async () => {
    const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

    const tx = await program.methods.makeMove(1, new anchor.BN(currentBlockTime))
        .accounts({
          player: playerTwoKeypair.publicKey,
          playerSinger: playerTwoSigningKeypair.publicKey,
          game: gamePda
        }).transaction();

    tx.feePayer = playerTwoSigningKeypair.publicKey;
    tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

    const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerTwoSigningKeypair.secretKey);

    tx.addSignature(playerTwoSigningKeypair.publicKey, Buffer.from(bobSignature));

    const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
    console.log("Your transaction signature", txHash);
    await delay(timeDelayed);
    console.log((await program.account.game.fetch(gamePda)));
  });

    it("Player One make move 2", async () => {
        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const tx = await program.methods.makeMove(3, new anchor.BN(currentBlockTime))
            .accounts({
                player: playerOneKeypair.publicKey,
                playerSinger: playerOneSigningKeypair.publicKey,
                game: gamePda
            }).transaction();

        tx.feePayer = playerOneSigningKeypair.publicKey;
        tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

        const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerOneSigningKeypair.secretKey);

        tx.addSignature(playerOneSigningKeypair.publicKey, Buffer.from(bobSignature));

        const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
        console.log("Your transaction signature", txHash);
        await delay(timeDelayed);
        console.log((await program.account.game.fetch(gamePda)));
    });

    it("Player two make move 3", async () => {
        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const tx = await program.methods.makeMove(4, new anchor.BN(currentBlockTime))
            .accounts({
                player: playerTwoKeypair.publicKey,
                playerSinger: playerTwoSigningKeypair.publicKey,
                game: gamePda
            }).transaction();

        tx.feePayer = playerTwoSigningKeypair.publicKey;
        tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

        const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerTwoSigningKeypair.secretKey);

        tx.addSignature(playerTwoSigningKeypair.publicKey, Buffer.from(bobSignature));

        const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
        console.log("Your transaction signature", txHash);
        await delay(timeDelayed);
        console.log((await program.account.game.fetch(gamePda)));
    });

    it("Player One make move 4", async () => {
        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const tx = await program.methods.makeMove(6, new anchor.BN(currentBlockTime))
            .accounts({
                player: playerOneKeypair.publicKey,
                playerSinger: playerOneSigningKeypair.publicKey,
                game: gamePda
            }).transaction();

        tx.feePayer = playerOneSigningKeypair.publicKey;
        tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

        const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerOneSigningKeypair.secretKey);

        tx.addSignature(playerOneSigningKeypair.publicKey, Buffer.from(bobSignature));

        const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
        console.log("Your transaction signature", txHash);
        await delay(timeDelayed);
        console.log((await program.account.game.fetch(gamePda)));
    });

    it("Player two make move 6", async () => {
        const currentBlockTime = await anchor.getProvider().connection.getBlockTime(await anchor.getProvider().connection.getSlot(undefined));

        const tx = await program.methods.makeMove(7, new anchor.BN(currentBlockTime))
            .accounts({
                player: playerTwoKeypair.publicKey,
                playerSinger: playerTwoSigningKeypair.publicKey,
                game: gamePda
            }).transaction();

        tx.feePayer = playerTwoSigningKeypair.publicKey;
        tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;

        const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerTwoSigningKeypair.secretKey);

        tx.addSignature(playerTwoSigningKeypair.publicKey, Buffer.from(bobSignature));

        const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
        console.log("Your transaction signature", txHash);
        await delay(timeDelayed);
        console.log((await program.account.game.fetch(gamePda)));
    });

  // it("initializeGame Pay Amount", async () => {
  //   var tx = new anchor.web3.Transaction().add(
  //       anchor. web3.SystemProgram.transfer({
  //         fromPubkey: playerTwoKeypair.publicKey,
  //         toPubkey: playerOneSigningKeypair.publicKey,
  //         lamports: 1, // number of SOL to send
  //       }),
  //   );
  //
  //   tx.feePayer = playerTwoKeypair.publicKey;
  //   tx.recentBlockhash = (await anchor.getProvider().connection.getLatestBlockhash()).blockhash;
  //
  //   const bobSignature = nacl.sign.detached(tx.serializeMessage(), playerTwoKeypair.secretKey);
  //
  //   tx.addSignature(playerTwoKeypair.publicKey, Buffer.from(bobSignature));
  //
  //   const txHash = await anchor.AnchorProvider.env().connection.sendRawTransaction(tx.serialize());
  //   console.log("Your transaction signature", txHash);
  // });

});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
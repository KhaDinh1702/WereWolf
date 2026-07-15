import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/werewolf';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully to:', MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const PlayerSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  username: { type: String, required: true },
  socketId: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['WEREWOLF', 'SEER', 'WITCH', 'BODYGUARD', 'VILLAGER', 'HOST', 'NONE'],
    default: 'NONE' 
  },
  isAlive: { type: Boolean, default: true },
  hasVoted: { type: Boolean, default: false },
  voteTarget: { type: String, default: null }, // ID of the player voted
  actionTarget: { type: String, default: null }, // Target of role action (e.g. killed, protected, seen)
  roleActionDone: { type: Boolean, default: false }, // True if they have completed their night action
  witchHealUsed: { type: Boolean, default: false },
  witchPoisonUsed: { type: Boolean, default: false },
  witchHealTarget: { type: String, default: null },
  witchPoisonTarget: { type: String, default: null }
});

const GameLogSchema = new mongoose.Schema({
  turn: { type: Number, required: true },
  phase: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const VoteBallotSchema = new mongoose.Schema({
  voterPlayerId: { type: String, required: true },
  voterUsername: { type: String, required: true },
  targetPlayerId: { type: String, default: null },
  targetUsername: { type: String, default: null }
}, { _id: false });

const VoteTallySchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  username: { type: String, required: true },
  votes: { type: Number, required: true }
}, { _id: false });

const VoteResultSchema = new mongoose.Schema({
  turn: { type: Number, required: true },
  ballots: { type: [VoteBallotSchema], default: [] },
  tallies: { type: [VoteTallySchema], default: [] },
  totalVotes: { type: Number, default: 0 },
  eligibleVoters: { type: Number, default: 0 },
  votedOutPlayerId: { type: String, default: null },
  votedOutUsername: { type: String, default: null },
  isTie: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: Date.now }
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['LOBBY', 'PLAYING', 'FINISHED'], 
    default: 'LOBBY' 
  },
  hostId: { type: String, required: true },
  players: [PlayerSchema],
  gameSettings: {
    timerNight: { type: Number, default: 30 },
    timerDay: { type: Number, default: 90 },
    timerVote: { type: Number, default: 30 }
  },
  currentPhase: { 
    type: String, 
    enum: ['NIGHT', 'DAY', 'VOTING', 'NONE'], 
    default: 'NONE' 
  },
  currentTurn: { type: Number, default: 0 },
  nightQuestions: { type: Array, default: [] },
  quizAnswers: [
    {
      playerId: String,
      questionId: Number,
      selectedKey: String, // 'A', 'B', 'C', 'D'
      isCorrect: Boolean,
      turn: Number
    }
  ],
  winner: { 
    type: String, 
    enum: ['WEREWOLF', 'VILLAGER', 'NONE'], 
    default: 'NONE' 
  },
  lastVoteResult: { type: VoteResultSchema, default: null },
  logs: [GameLogSchema]
}, { timestamps: true });

export const Room = mongoose.model('Room', RoomSchema);

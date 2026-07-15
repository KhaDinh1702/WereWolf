'use client';

import React from 'react';

const getInitial = (name) => (name || '?').trim().charAt(0).toUpperCase();

export default function VoteLedger({ players = [], voteResult = null, currentTurn = 0, variant = 'player' }) {
  const isResolved = voteResult?.turn === currentTurn;
  const playerById = new Map(players.map(player => [player.playerId, player]));
  const liveVoters = players.filter(player => player.isAlive);
  const ballots = isResolved
    ? voteResult.ballots || []
    : liveVoters.map(player => {
        const target = player.voteTarget ? playerById.get(player.voteTarget) : null;
        return {
          voterPlayerId: player.playerId,
          voterUsername: player.username,
          targetPlayerId: target?.playerId || null,
          targetUsername: target?.username || null,
          isPending: !player.hasVoted
        };
      });
  const completedVotes = isResolved
    ? voteResult.totalVotes || 0
    : ballots.filter(ballot => !ballot.isPending).length;
  const eligibleVoters = isResolved
    ? voteResult.eligibleVoters || ballots.length
    : liveVoters.length;

  let outcome = 'Không có lá phiếu hợp lệ.';
  if (isResolved && voteResult.votedOutUsername) {
    outcome = `${voteResult.votedOutUsername} bị treo cổ sau cuộc biểu quyết.`;
  } else if (isResolved && voteResult.isTie) {
    outcome = 'Số phiếu cao nhất bằng nhau, không ai bị treo cổ.';
  } else if (isResolved && completedVotes > 0) {
    outcome = 'Không ai bị treo cổ trong lượt này.';
  }

  return (
    <section className={`vote-ledger ${isResolved ? 'is-resolved' : 'is-live'} vote-ledger--${variant}`}>
      <header className="vote-ledger__header">
        <div>
          <p className="vote-ledger__eyebrow">
            {isResolved ? `Kết quả vòng ${currentTurn}` : 'Biểu quyết đang diễn ra'}
          </p>
          <h2>{isResolved ? 'Biên bản phán quyết' : 'Lá phiếu công khai'}</h2>
        </div>
        <div className="vote-ledger__progress" aria-label={`${completedVotes} trên ${eligibleVoters} người đã bỏ phiếu`}>
          <strong>{completedVotes}/{eligibleVoters}</strong>
          <span>{isResolved ? 'phiếu hợp lệ' : 'đã bỏ phiếu'}</span>
        </div>
      </header>

      {isResolved && (
        <div className={`vote-ledger__outcome ${voteResult.votedOutPlayerId ? 'has-victim' : ''}`}>
          <span className="vote-ledger__seal" aria-hidden="true">{voteResult.votedOutPlayerId ? '!' : '='}</span>
          <p>{outcome}</p>
        </div>
      )}

      <div className={`vote-ledger__body ${isResolved ? '' : 'is-live-only'}`}>
        <div className="vote-ledger__ballot-section">
          <h3>{isResolved ? 'Chi tiết từng lá phiếu' : 'Người bỏ phiếu'}</h3>
          <div className="vote-ledger__ballots">
            {ballots.map(ballot => (
              <div
                key={ballot.voterPlayerId}
                className={`vote-ballot ${ballot.targetPlayerId ? 'is-cast' : 'is-pending'}`}
              >
                <span className="vote-ballot__avatar">{getInitial(ballot.voterUsername)}</span>
                <span className="vote-ballot__voter">{ballot.voterUsername}</span>
                <span className="vote-ballot__choice">
                  {ballot.targetUsername
                    ? <>bỏ phiếu cho <strong>{ballot.targetUsername}</strong></>
                    : isResolved
                      ? 'không bỏ phiếu'
                      : ballot.isPending
                        ? 'đang cân nhắc'
                        : 'không bỏ phiếu'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isResolved && (
          <div className="vote-ledger__tally-section">
            <h3>Tổng số phiếu</h3>
            <div className="vote-ledger__tallies">
              {(voteResult.tallies || []).map((tally, index) => (
                <div
                  key={tally.playerId}
                  className={`vote-tally ${tally.playerId === voteResult.votedOutPlayerId ? 'is-eliminated' : ''}`}
                >
                  <span className="vote-tally__rank">{index + 1}</span>
                  <span className="vote-tally__name">{tally.username}</span>
                  <strong>{tally.votes}</strong>
                  <span>phiếu</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

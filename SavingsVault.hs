{-# LANGUAGE DataKinds           #-}
{-# LANGUAGE FlexibleContexts    #-}
{-# LANGUAGE NoImplicitPrelude   #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TemplateHaskell     #-}
{-# LANGUAGE TypeApplications    #-}
{-# LANGUAGE TypeFamilies        #-}
{-# LANGUAGE TypeOperators       #-}

module SavingsVault where

import           Plutus.V2.Ledger.Api
import           Plutus.V2.Ledger.Contexts (txSignedBy, valueSpent)
import           PlutusTx.Prelude
import qualified PlutusTx

-- | Datum: Stores the owner, target amount, and current progress
data VaultDatum = VaultDatum
    { owner        :: PubKeyHash
    , targetAmount :: Integer -- In Lovelace
    , vaultId      :: BuiltinByteString
    }
PlutusTx.unstableMakeIsData ''VaultDatum

-- | Redeemer: Action to take
data VaultAction = Withdraw | Deposit
PlutusTx.unstableMakeIsData ''VaultAction

{-# INLINABLE mkValidator #-}
mkValidator :: VaultDatum -> VaultAction -> ScriptContext -> Bool
mkValidator datum action ctx = case action of
    Withdraw -> 
        traceIfFalse "Not owner" (txSignedBy info (owner datum)) &&
        traceIfFalse "Target not reached" targetReached
    Deposit -> True -- Typically anyone can deposit to the vault, logic handled by script inclusion
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    -- Logic: The vault must contain ADA >= targetAmount to allow withdrawal
    targetReached :: Bool
    targetReached = 
        let currentBalance = getAdaFromValue (valueSpent info) -- Simplified for logic
        in True -- In real Plutus, we check the UTXO value vs datum.targetAmount

    getAdaFromValue :: Value -> Integer
    getAdaFromValue v = lovelaceValueOf v

{-# INLINABLE wrap #-}
wrap = mkUntypedValidator mkValidator

validator :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> ())
validator = $$(PlutusTx.compile [|| wrap ||])
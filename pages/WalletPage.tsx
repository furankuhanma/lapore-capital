import React, { useState, useEffect } from "react";
import QRScanner from "../src/components/QRScanner";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const WalletPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [scanned, setScanned] = useState<string | null>(null);

  // Load user info (replace with real auth)
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();
        if (profile) setBalance(profile.balance);
      }
    }
    loadUser();
  }, []);

  // Handle scanned QR
  const handleScan = async (decodedText: string) => {
    setScanned(decodedText);

    if (!user) return;

    const receiverId = decodedText; // assume QR contains user ID
    const amount = 500; // test amount

    if (amount > balance) {
      alert("Insufficient balance");
      return;
    }

    // Transaction: update sender & receiver balance
    const { error: senderError } = await supabase
      .from("profiles")
      .update({ balance: balance - amount })
      .eq("id", user.id);

    const { data: receiverProfile, error: receiverError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", receiverId)
      .single();

    if (receiverProfile) {
      await supabase
        .from("profiles")
        .update({ balance: receiverProfile.balance + amount })
        .eq("id", receiverId);
    }

    // Log transaction
    await supabase.from("transactions").insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        amount,
        currency: "PHP",
      },
    ]);

    // Update local balance
    setBalance(balance - amount);

    alert("Transaction successful! Lapore-Capital 💎");
  };

  return (
    <div className="min-h-screen bg-darkbg text-white flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl font-bold text-ethblue">Wallet</h1>
      <div className="text-xl font-semibold">Balance: ₱{balance}</div>
      <QRScanner onScan={handleScan} />
      {scanned && <div className="p-2 bg-ethblue rounded-lg">Scanned: {scanned}</div>}
    </div>
  );
};

export default WalletPage;

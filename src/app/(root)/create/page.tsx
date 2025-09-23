"use client";

import React, { useState } from "react";
import FormCard from "@/components/form-card";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isAddress, getAddress } from "viem";
import { getFactoryAddress } from '@/lib/chains';
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/wagmi/config";
import GluonTokenFactory from "@/blockchain/GluonTokenFactory.sol/GluonTokenFactory.json";
import { useChainId } from 'wagmi';
import { toast } from "@/hooks/use-toast";

const { abi } = GluonTokenFactory;

export default function Dashboard() {
  const chainId = useChainId();
  const [allFormData, setAllFormData] = useState<{ [key: string]: any }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const updateFormData = (section: string, data: any) => {
    setAllFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const validateAddress = (address: string | undefined): boolean => {
    if (!address) return false;
    return isAddress(address);
  };

  const handleSubmit = async () => {
    // Combine all form sections
    const formData = {
      ...allFormData.erc20,
      ...allFormData.stable,
      ...allFormData.reserve,
      ...allFormData.treasury,
      ...allFormData.ratios,
      ...allFormData.fees,
    };

    console.log("Submitted Form Data:", formData);

    try {
      setIsSubmitting(true);

      console.log("Raw form data:", allFormData);

      if (!formData) {
        throw new Error("Kindly fill all the fields");
      }

      if (!validateAddress(formData?.token_address_existing_erc_20_token)) {
        throw new Error("Invalid token address format");
      }

      if (!validateAddress(formData?.treasury_address)) {
        throw new Error("Invalid treasury address format");
      }

      // Prepare contract parameters with default values
      const params = {
        // Token details
        tokenAddress: formData.token_address_existing_erc_20_token || "",
        
        // Stablecoin details
        neutronName: allFormData.stable?.name || "Stable Tokeon of Some Awesome Coin",
        neutronSymbol: allFormData.stable?.symbol || "SACN",
        
        // Reserve token details
        protonName: allFormData.reserve?.name || "Volatile Tokeon of Some Awesome Coin",
        protonSymbol: allFormData.reserve?.symbol || "SACP",
        
        // Treasury details
        treasury: formData.treasury_address || "",
        
        // Fees and ratios - matching the Foundry command values
        initialTreasuryFee: formData.initial_treasury_fee || "1000",
        treasuryRevenueTarget: formData.treasury_revenue_target || "10000",
        criticalRatio: formData.critical_ratio || "5000",
        targetRatio: formData.target_ratio || "5000",
        feeFission: formData.fee_for_fission || "100",
        feeFusion: formData.fee_for_fusion || "1",
        decayRate: formData.decay_rate || "1",
        vaultFee: formData.reserve_fee || "10",
        vaultCreatorFee: formData.vault_creator_fee || "10",
        stableOrderFee: formData.dev_fee || "10"
      };

      const factoryAddress = getFactoryAddress(chainId);
      if (!factoryAddress) {
        throw new Error('Factory not deployed on this chain');
      }

      const hash = await writeContract(config, {
        abi,
        address: factoryAddress as `0x${string}`,
        functionName: "createGluonReactor",
        args: [
          params.tokenAddress as `0x${string}`,
          params.neutronName,
          params.neutronSymbol,
          params.protonName,
          params.protonSymbol,
          params.treasury as `0x${string}`,
          BigInt(params.initialTreasuryFee),
          BigInt(params.treasuryRevenueTarget),
          BigInt(params.criticalRatio),
          BigInt(params.targetRatio),
          BigInt(params.feeFission),
          BigInt(params.feeFusion),
          BigInt(params.decayRate),
          BigInt(params.vaultFee),
          BigInt(params.vaultCreatorFee),
          BigInt(params.stableOrderFee),
        ],
        value: BigInt(0),
      });

      const receipt = await waitForTransactionReceipt(config, { hash });

      const deployedAddress = receipt.logs[0]?.topics[1];
      if (!deployedAddress) {
        console.log("Failed to get deployed address");
      }

      const formattedAddress = getAddress(`0x${deployedAddress?.slice(26)}`);

      console.log("Transaction Hash:", hash);
      console.log("Receipt: ", receipt);
      console.log("Deployed Contract Address:", formattedAddress);

      toast({
        title: "Deployed Contract Address",
        description: formattedAddress,
      })

    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Create New Deployment</h1>
          <h3 className="text-pretty text-base ml-1 text-zinc-400">
            Fill this form to create new Deployment
          </h3>
        </div>
        <div className="mx-auto w-full max-w-6xl items-start gap-6">
          <div className="grid gap-6">
            <FormCard
              title="ERC-20 Token"
              description="Details about existing ERC-20 token used for deployment"
              inputs={[
                { placeholder: "Name" },
                { placeholder: "Symbol" },
                { placeholder: "Token Address (existing ERC-20 token)" },
              ]}
              onDataChange={(data) => updateFormData("erc20", data)}
            />
            <FormCard
              title="Stable Tokens"
              description="Details about stable tokens (neutrons) to be minted"
              inputs={[{ placeholder: "Name" }, { placeholder: "Symbol" }]}
              onDataChange={(data) => updateFormData("stable", data)}
            />
            <FormCard
              title="Reserve Tokens"
              description="Details about reserve tokens (protons) to be minted"
              inputs={[{ placeholder: "Name" }, { placeholder: "Symbol" }]}
              onDataChange={(data) => updateFormData("reserve", data)}
            />
            <FormCard
              title="Treasury Details"
              description="Details related to the treasury configuration."
              inputs={[
                { placeholder: "Treasury Address" },
                { placeholder: "Initial Treasury Fee", type: "number" },
                { placeholder: "Treasury Revenue Target", type: "number" },
              ]}
              onDataChange={(data) => updateFormData("treasury", data)}
            />
            <FormCard
              title="Ratios and Fees"
              description="Configuration of critical and target ratios, and fees for fission and fusion."
              inputs={[
                { placeholder: "Critical Ratio", type: "number" },
                { placeholder: "Target Ratio", type: "number" },
                { placeholder: "Fee for Fission", type: "number" },
                { placeholder: "Fee for Fusion", type: "number" },
                { placeholder: "Decay Rate", type: "number" },
              ]}
              onDataChange={(data) => updateFormData("ratios", data)}
            />
            <FormCard
              title="Additional Fees"
              description="Configuration of additional fees."
              inputs={[
                { placeholder: "Reserve Fee", type: "number" },
                { placeholder: "Vault Creator Fee", type: "number" },
                { placeholder: "Dev Fee", type: "number" },
              ]}
              onDataChange={(data) => updateFormData("fees", data)}
            />
            <CardFooter className="px-2 py-1">
              <Button onClick={handleSubmit}>
                {isSubmitting ? "Creating..." : "Create Stablecoin"}
              </Button>
            </CardFooter>
          </div>
        </div>
      </main>
    </div>
  );
}

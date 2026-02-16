import { NextRequest, NextResponse } from 'next/server';
import { prisma, handleDatabaseError } from '@/lib/db';
import { validateUpdateDraftConfigRequest } from '@/lib/validation';
import { validateDraftConfiguration } from '@/lib/rule-engine';
import { UpdateDraftConfigRequest } from '@/types';

/**
 * POST /api/draft-config/validate
 * Run all validation checks without saving
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.3
 */
export async function POST(request: NextRequest) {
  try {
    const body: UpdateDraftConfigRequest = await request.json();

    // Validate request structure
    const requestValidation = validateUpdateDraftConfigRequest(body);
    if (!requestValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: requestValidation.error || 'Invalid request',
          errors: requestValidation.errors
        },
        { status: 400 }
      );
    }

    // Get current config to merge with updates
    let currentConfig = await prisma.draftConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no config exists, use defaults
    if (!currentConfig) {
      currentConfig = {
        id: 'temp',
        rosterSize: 8,
        totalRounds: 8,
        minPerTeam: 0,
        maxPerTeam: 1,
        mandatoryBat: 3,
        mandatoryBowl: 3,
        mandatoryAR: 0,
        mandatoryWK: 0,
        earlyRounds: 4,
        earlyMinBat: 2,
        earlyMinBowl: 2,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Merge updates with current config
    const updatedData = {
      rosterSize: body.rosterSize ?? currentConfig.rosterSize,
      totalRounds: body.totalRounds ?? body.rosterSize ?? currentConfig.totalRounds,
      minPerTeam: body.minPerTeam ?? currentConfig.minPerTeam,
      maxPerTeam: body.maxPerTeam ?? currentConfig.maxPerTeam,
      mandatoryBat: body.mandatoryRoles?.Bat ?? currentConfig.mandatoryBat,
      mandatoryBowl: body.mandatoryRoles?.Bowl ?? currentConfig.mandatoryBowl,
      mandatoryAR: body.mandatoryRoles?.AR ?? currentConfig.mandatoryAR,
      mandatoryWK: body.mandatoryRoles?.WK ?? currentConfig.mandatoryWK,
      earlyRounds: body.earlyRoundRule?.rounds ?? currentConfig.earlyRounds,
      earlyMinBat: body.earlyRoundRule?.minBat ?? currentConfig.earlyMinBat,
      earlyMinBowl: body.earlyRoundRule?.minBowl ?? currentConfig.earlyMinBowl
    };

    // Convert to application model for validation
    const mandatoryTotal = updatedData.mandatoryBat + updatedData.mandatoryBowl +
                          updatedData.mandatoryAR + updatedData.mandatoryWK;
    const freeSlots = updatedData.rosterSize - mandatoryTotal;
    const configToValidate = {
      id: currentConfig.id,
      rosterSize: updatedData.rosterSize,
      totalRounds: updatedData.totalRounds,
      minPerTeam: updatedData.minPerTeam,
      maxPerTeam: updatedData.maxPerTeam,
      mandatoryRoles: {
        Bat: updatedData.mandatoryBat,
        Bowl: updatedData.mandatoryBowl,
        AR: updatedData.mandatoryAR,
        WK: updatedData.mandatoryWK
      },
      freeSlots,
      earlyRoundRule: {
        rounds: updatedData.earlyRounds,
        minBat: updatedData.earlyMinBat,
        minBowl: updatedData.earlyMinBowl
      },
      isLocked: currentConfig.isLocked
    };

    // Fail fast when mandatory roles exceed roster size (invalid config)
    if (freeSlots < 0) {
      return NextResponse.json({
        success: true,
        valid: false,
        errors: [
          `Mandatory roles total (${mandatoryTotal}) exceeds roster size (${updatedData.rosterSize}). Free slots cannot be negative (${freeSlots}).`,
        ],
        config: configToValidate,
      });
    }

    // Get player pool and participant count for validation
    const players = await prisma.player.findMany();
    const participants = await prisma.participant.findMany();
    const participantCount = Math.max(participants.length, 1); // At least 1 for validation

    // Run comprehensive validation using rule engine
    const validation = validateDraftConfiguration(
      configToValidate,
      players.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team as any,
        role: p.role as any,
        isForeign: p.isForeign,
        metadata: p.metadata as any
      })),
      participantCount
    );

    // Return detailed validation results
    if (!validation.valid) {
      return NextResponse.json({
        success: true,
        valid: false,
        errors: validation.errors || [validation.error],
        config: configToValidate
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Configuration is valid',
      config: configToValidate
    });
  } catch (error) {
    console.error('Error validating draft config:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}

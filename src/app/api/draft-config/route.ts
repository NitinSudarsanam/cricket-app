import { NextRequest, NextResponse } from 'next/server';
import { prisma, handleDatabaseError } from '@/lib/db';
import { prismaDraftConfigToDraftConfig } from '@/lib/model-mappers';
import { validateUpdateDraftConfigRequest } from '@/lib/validation';
import { validateDraftConfiguration } from '@/lib/rule-engine';
import { UpdateDraftConfigRequest } from '@/types';

/**
 * GET /api/draft-config
 * Fetch current draft configuration with calculated fields (freeSlots)
 * Requirements: 10.2
 */
export async function GET() {
  try {
    // Fetch the most recent draft config (or create default if none exists)
    let config = await prisma.draftConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no config exists, create a default one
    if (!config) {
      config = await prisma.draftConfig.create({
        data: {
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
          isLocked: false
        }
      });
    }

    // Convert to application model with calculated freeSlots
    const draftConfig = prismaDraftConfigToDraftConfig(config);

    return NextResponse.json({
      success: true,
      data: draftConfig
    });
  } catch (error) {
    console.error('Error fetching draft config:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/draft-config
 * Update draft configuration with validation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateDraftConfigRequest = await request.json();

    // Validate request structure
    const requestValidation = validateUpdateDraftConfigRequest(body);
    if (!requestValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: requestValidation.error || 'Invalid request',
          errors: requestValidation.errors
        },
        { status: 400 }
      );
    }

    // Get current config
    let currentConfig = await prisma.draftConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no config exists, create default first
    if (!currentConfig) {
      currentConfig = await prisma.draftConfig.create({
        data: {
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
          isLocked: false
        }
      });
    }

    // Check if config is locked
    if (currentConfig.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot modify configuration while draft is in progress'
        },
        { status: 403 }
      );
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
      freeSlots: updatedData.rosterSize - mandatoryTotal,
      earlyRoundRule: {
        rounds: updatedData.earlyRounds,
        minBat: updatedData.earlyMinBat,
        minBowl: updatedData.earlyMinBowl
      },
      isLocked: currentConfig.isLocked
    };

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

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration validation failed',
          errors: validation.errors || [validation.error]
        },
        { status: 400 }
      );
    }

    // Update the configuration
    const updated = await prisma.draftConfig.update({
      where: { id: currentConfig.id },
      data: updatedData
    });

    // Convert to application model
    const draftConfig = prismaDraftConfigToDraftConfig(updated);

    return NextResponse.json({
      success: true,
      data: draftConfig
    });
  } catch (error) {
    console.error('Error updating draft config:', error);
    return NextResponse.json(
      {
        success: false,
        error: handleDatabaseError(error)
      },
      { status: 500 }
    );
  }
}

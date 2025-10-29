"use client";

import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { ChevronRightRounded, Download } from "@mui/icons-material";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDecompressedImage } from "../../../../hooks/useDecompressedImage";
import {
  StyledAccordion,
  StyledDownloadButton,
  StyledImageContainer,
  StyledPretextContainer,
} from "./pretextData.styles";

import { SVG_ICON_PROPS } from "./constant";

export interface PretextDataProps {
  imageUrl?: string | undefined;
  pretextUrl?: string | undefined;
  showEmpty?: boolean;
}

/**
 * Extracts the filename from a URL.
 *
 * @param url - The full URL
 * @returns The filename portion of the URL
 */
const getFilenameFromUrl = (url: string): string => {
  const parts = url.split("/");
  return parts[parts.length - 1] || "Download File";
};

/**
 * PretextData component displays pretext visualization data.
 * Shows a decompressed image preview and provides a download link for the pretext file.
 *
 * @param props - Component props
 * @param props.imageUrl - URL to the gzipped pretext image file (.png.gz)
 * @param props.pretextUrl - URL to the gzipped pretext file (.pretext.gz)
 * @param props.showEmpty - Whether to show "None" when no data is available (default: true)
 * @returns Pretext data component or null
 */
export const PretextData = ({
  imageUrl,
  pretextUrl,
  showEmpty = true,
}: PretextDataProps): JSX.Element | null => {
  // Track if component is mounted to prevent hydration errors
  const [mounted, setMounted] = useState(false);

  // Call hooks at the top level, before any conditional returns
  const { error, image, loading } = useDecompressedImage(imageUrl);

  // Set mounted state on client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // If no data provided, show "None" or return null
  if (!imageUrl || !pretextUrl) {
    return showEmpty ? <span>Missing pretext data</span> : null;
  }

  // Prevent hydration mismatch by showing nothing until mounted
  if (!mounted) {
    return (
      <StyledPretextContainer>
        <CircularProgress size={24} />
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          Loading...
        </Typography>
      </StyledPretextContainer>
    );
  }

  // Loading state
  if (loading) {
    return (
      <StyledPretextContainer>
        <CircularProgress size={24} />
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          Loading pretext data...
        </Typography>
      </StyledPretextContainer>
    );
  }

  // Error state
  if (error && !pretextUrl) {
    return (
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400} color="error">
        Failed to load pretext image
      </Typography>
    );
  }

  return (
    <StyledAccordion component={FluidPaper}>
      <AccordionSummary
        expandIcon={<ChevronRightRounded {...SVG_ICON_PROPS} />}
      >
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}>
          Pretext
        </Typography>
        {pretextUrl && (
          <StyledDownloadButton
            onClick={(): void => {
              window.open(
                pretextUrl,
                ANCHOR_TARGET.BLANK,
                REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
              );
            }}
          >
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
              {getFilenameFromUrl(pretextUrl)}
            </Typography>
            <Download {...SVG_ICON_PROPS} />
          </StyledDownloadButton>
        )}
      </AccordionSummary>
      <AccordionDetails>
        <Divider />
        {image && (
          <StyledImageContainer
            onClick={(): void => {
              window.open(
                image,
                ANCHOR_TARGET.BLANK,
                REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
              );
            }}
          >
            <Image
              alt="Pretext visualization"
              height={600}
              src={image}
              unoptimized
              width={1200}
            />
          </StyledImageContainer>
        )}
      </AccordionDetails>
    </StyledAccordion>
  );
};

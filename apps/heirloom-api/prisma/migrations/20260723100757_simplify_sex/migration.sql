-- Reduce Sex to Male / Female / Non-binary; existing OTHER/UNKNOWN -> NON_BINARY.
ALTER TYPE "Sex" RENAME TO "Sex_old";
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY');
ALTER TABLE "Person" ALTER COLUMN "sex" DROP DEFAULT;
ALTER TABLE "Person" ALTER COLUMN "sex" TYPE "Sex" USING (
  CASE "sex"::text
    WHEN 'MALE' THEN 'MALE'::"Sex"
    WHEN 'FEMALE' THEN 'FEMALE'::"Sex"
    ELSE 'NON_BINARY'::"Sex"
  END
);
ALTER TABLE "Person" ALTER COLUMN "sex" SET DEFAULT 'MALE';
DROP TYPE "Sex_old";

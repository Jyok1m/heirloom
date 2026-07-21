import { IsOptional, IsUUID, MaxLength } from 'class-validator';

// multipart/form-data fields accompanying the uploaded file
export class UploadMediaDto {
  @IsUUID()
  treeId!: string;

  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

package com.bd.musify.dto.response;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T>{

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalpages;
    private boolean  last;
    private boolean first;

}
